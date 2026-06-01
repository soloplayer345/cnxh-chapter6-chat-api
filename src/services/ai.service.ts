import { v4 as uuidv4 } from "uuid";
import {
  findRelevantRecords,
  formatRecordsAsContext,
} from "./dataset.service";
import { generateAnswer } from "./ollama.service";
import * as chatHistory from "./chatHistory.service";
import { ChatMessage } from "../types/ai.types";

const CONTEXT_RECORD_LIMIT = 5;
/** 5 lượt hỏi đáp = tối đa 10 tin nhắn (user + assistant) */
const HISTORY_MESSAGE_LIMIT = 10;

function formatHistoryForPrompt(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return "(Chưa có lịch sử trò chuyện)";
  }

  return messages
    .map((m) => `${m.role === "user" ? "Người dùng" : "Trợ lý"}: ${m.content}`)
    .join("\n");
}

function buildPrompt(
  context: string,
  history: string,
  message: string
): string {
  return `Bạn là chatbot hỗ trợ học môn Chủ nghĩa xã hội khoa học.
Bạn chỉ được trả lời dựa trên dữ liệu Chương 6 được cung cấp.
Nếu câu hỏi nằm ngoài nội dung Chương 6, hãy nói rằng nội dung này chưa có trong dữ liệu.
Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu, phù hợp cho sinh viên ôn tập.
Không bịa thông tin ngoài context.

Dữ liệu liên quan:
${context}

Lịch sử trò chuyện gần đây:
${history}

Câu hỏi của người dùng:
${message}

Hãy trả lời:`;
}

export interface ChatResult {
  sessionId: string;
  answer: string;
  history: ChatMessage[];
}

/** Xử lý một lượt hỏi đáp: context + Ollama + lưu lịch sử */
export async function processChat(
  message: string,
  sessionId?: string
): Promise<ChatResult> {
  // Chỉ dùng sessionId đã tồn tại; session mới được ghi sau khi Ollama trả lời
  let activeSessionId = sessionId ?? uuidv4();
  const existingSession = sessionId
    ? await chatHistory.getSession(sessionId)
    : undefined;

  if (sessionId && !existingSession) {
    activeSessionId = uuidv4();
  }

  const relevantRecords = await findRelevantRecords(
    message,
    CONTEXT_RECORD_LIMIT
  );
  const context = formatRecordsAsContext(relevantRecords);

  const recentMessages = await chatHistory.getRecentMessages(
    activeSessionId,
    HISTORY_MESSAGE_LIMIT
  );
  const historyText = formatHistoryForPrompt(recentMessages);

  const prompt = buildPrompt(context, historyText, message);
  const answer = await generateAnswer(prompt);

  await chatHistory.ensureSession(activeSessionId);
  await chatHistory.addMessage(activeSessionId, "user", message);
  await chatHistory.addMessage(activeSessionId, "assistant", answer);

  const updatedSession = await chatHistory.getSession(activeSessionId);

  return {
    sessionId: activeSessionId,
    answer,
    history: updatedSession?.messages ?? [],
  };
}
