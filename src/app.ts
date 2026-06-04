import dotenv from "dotenv";
import express from "express";

dotenv.config();
import cors from "cors";
import aiRoutes from "./routes/ai.routes";
import { openApiSpec, swaggerServe, swaggerUiHandler } from "./config/swagger";

const app = express();

/** CORS mở cho FE deploy (Vercel, Netlify, …) gọi API qua ngrok */
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

app.use("/api-docs", swaggerServe, swaggerUiHandler);
app.get("/api-docs.json", (_req, res) => {
  res.json(openApiSpec);
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "CNXH Chapter 6 Chat API",
    message: "Chatbot hỏi đáp Chương 6 - Vấn đề dân tộc và tôn giáo",
    docs: "GET /api-docs",
    endpoints: {
      health: "GET /health",
      chat: "POST /api/ai/chat",
      history: "GET /api/ai/history/:sessionId",
      deleteHistory: "DELETE /api/ai/history/:sessionId",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/api/ai", aiRoutes);

export default app;
