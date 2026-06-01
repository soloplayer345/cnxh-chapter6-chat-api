import { v4 as uuidv4 } from "uuid";
import {
  findRelevantRecordsWithScore,
  formatRecordsAsContext,
} from "./dataset.service";
import { generateAnswer } from "./ollama.service";
import * as chatHistory from "./chatHistory.service";
import { ChatMessage } from "../types/ai.types";

const CONTEXT_RECORD_LIMIT = 5;
/** 5 lượt hỏi đáp = tối đa 10 tin nhắn (user + assistant) */
const HISTORY_MESSAGE_LIMIT = 10;

/** Trả lời cố định khi câu hỏi ngoài phạm vi Chương 6 */
export const OUT_OF_SCOPE_ANSWER =
  "Câu hỏi này ngoài phạm vi Chương 6 (Vấn đề dân tộc và tôn giáo) — chương trình môn CNXH khoa học. Tôi không trả lời được nội dung ngoài bài học.";

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
  return `Bạn là chatbot hỗ trợ học môn Chủ nghĩa xã hội khoa học — chỉ Chương 6: Vấn đề dân tộc và tôn giáo.
Bạn CHỈ được trả lời dựa trên "Dữ liệu liên quan" bên dưới.
Nếu câu hỏi không thuộc Chương 6 hoặc dữ liệu không đủ để trả lời, hãy trả lời ĐÚNG MỘT câu ngắn (không giải thích dài, không dùng kiến thức ngoài):
"${OUT_OF_SCOPE_ANSWER}"
Trả lời bằng tiếng Việt, rõ ràng, phù hợp sinh viên ôn tập khi trong phạm vi bài học.
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

  const { records: relevantRecords, isRelevant } =
    await findRelevantRecordsWithScore(message, CONTEXT_RECORD_LIMIT);

  const recentMessages = await chatHistory.getRecentMessages(
    activeSessionId,
    HISTORY_MESSAGE_LIMIT
  );
  const historyText = formatHistoryForPrompt(recentMessages);

  const answer = isRelevant
    ? await generateAnswer(
        buildPrompt(
          formatRecordsAsContext(relevantRecords),
          historyText,
          message
        )
      )
    : OUT_OF_SCOPE_ANSWER;

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
