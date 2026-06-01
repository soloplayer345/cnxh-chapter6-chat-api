import { Request, Response } from "express";
import * as aiService from "../services/ai.service";
import * as chatHistory from "../services/chatHistory.service";

/** POST /api/ai/chat */
export async function chat(req: Request, res: Response): Promise<void> {
  const { message, sessionId } = req.body ?? {};

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({
      success: false,
      message: "Message is required",
    });
    return;
  }

  try {
    const result = await aiService.processChat(message.trim(), sessionId);

    res.json({
      success: true,
      sessionId: result.sessionId,
      answer: result.answer,
      history: result.history,
    });
  } catch (error) {
    const err = error as Error & { isOllamaError?: boolean };

    if (err.isOllamaError) {
      res.status(503).json({
        success: false,
        message: err.message,
      });
      return;
    }

    console.error("Chat error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/** GET /api/ai/history/:sessionId */
export async function getHistory(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.params;
  const session = await chatHistory.getSession(sessionId);

  if (!session) {
    res.status(404).json({
      success: false,
      message: "Session not found",
    });
    return;
  }

  res.json({
    success: true,
    sessionId: session.sessionId,
    messages: session.messages,
  });
}

/** DELETE /api/ai/history/:sessionId */
export async function deleteHistory(
  req: Request,
  res: Response
): Promise<void> {
  const { sessionId } = req.params;
  const deleted = await chatHistory.deleteSession(sessionId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      message: "Session not found",
    });
    return;
  }

  res.json({
    success: true,
    message: "Chat history deleted successfully",
  });
}
