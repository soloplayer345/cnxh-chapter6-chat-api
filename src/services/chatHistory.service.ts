import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import {
  ChatHistoryStore,
  ChatMessage,
  ChatSession,
  MessageRole,
} from "../types/ai.types";
import { getDataFilePath } from "../utils/path.util";

const HISTORY_FILE = "chat-history.json";

async function ensureHistoryFile(): Promise<ChatHistoryStore> {
  const filePath = getDataFilePath(HISTORY_FILE);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as ChatHistoryStore;
    if (!data.sessions) {
      data.sessions = [];
    }
    return data;
  } catch {
    const empty: ChatHistoryStore = { sessions: [] };
    await fs.writeFile(filePath, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }
}

async function saveStore(store: ChatHistoryStore): Promise<void> {
  const filePath = getDataFilePath(HISTORY_FILE);
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export async function createSession(sessionId?: string): Promise<ChatSession> {
  const store = await ensureHistoryFile();
  const now = new Date().toISOString();

  const session: ChatSession = {
    sessionId: sessionId ?? uuidv4(),
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  store.sessions.push(session);
  await saveStore(store);
  return session;
}

/** Tạo session nếu chưa có (dùng sau khi có câu trả lời từ AI) */
export async function ensureSession(sessionId: string): Promise<ChatSession> {
  const existing = await getSession(sessionId);
  if (existing) {
    return existing;
  }
  return createSession(sessionId);
}

export async function getSession(
  sessionId: string
): Promise<ChatSession | undefined> {
  const store = await ensureHistoryFile();
  return store.sessions.find((s) => s.sessionId === sessionId);
}

export async function addMessage(
  sessionId: string,
  role: MessageRole,
  content: string
): Promise<ChatMessage> {
  const store = await ensureHistoryFile();
  const session = store.sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const message: ChatMessage = {
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  session.messages.push(message);
  session.updatedAt = message.createdAt;
  await saveStore(store);
  return message;
}

/** Lấy N tin nhắn gần nhất của session */
export async function getRecentMessages(
  sessionId: string,
  limit: number = 5
): Promise<ChatMessage[]> {
  const session = await getSession(sessionId);
  if (!session) {
    return [];
  }
  return session.messages.slice(-limit);
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const store = await ensureHistoryFile();
  const index = store.sessions.findIndex((s) => s.sessionId === sessionId);

  if (index === -1) {
    return false;
  }

  store.sessions.splice(index, 1);
  await saveStore(store);
  return true;
}
