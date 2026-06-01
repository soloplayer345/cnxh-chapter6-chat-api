import swaggerUi from "swagger-ui-express";

const port = Number(process.env.PORT) || 5000;

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "CNXH Chapter 6 Chat API",
    version: "1.0.0",
    description:
      "Chatbot hỏi đáp Chương 6 — Vấn đề dân tộc và tôn giáo (CNXH khoa học). Cần Ollama chạy local theo cấu hình `.env`.",
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: "Local",
    },
  ],
  tags: [{ name: "System" }, { name: "Chat" }],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Kiểm tra server",
        responses: {
          "200": {
            description: "API đang chạy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "API is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ai/chat": {
      post: {
        tags: ["Chat"],
        summary: "Gửi tin nhắn chat",
        description:
          "Gửi câu hỏi tới chatbot. `sessionId` tùy chọn — bỏ trống để tạo phiên mới.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    example: "Giải thích vấn đề dân tộc trong CNXH khoa học",
                  },
                  sessionId: {
                    type: "string",
                    format: "uuid",
                    description: "ID phiên chat (để tiếp tục hội thoại)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Trả lời thành công",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChatSuccess" },
              },
            },
          },
          "400": {
            description: "Thiếu message",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "503": {
            description: "Ollama không khả dụng",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Lỗi server",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/ai/history/{sessionId}": {
      get: {
        tags: ["Chat"],
        summary: "Lấy lịch sử chat theo session",
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Lịch sử phiên",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HistorySuccess" },
              },
            },
          },
          "404": {
            description: "Không tìm thấy session",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Chat"],
        summary: "Xóa lịch sử chat theo session",
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Đã xóa",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Chat history deleted successfully",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Không tìm thấy session",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      ChatMessage: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string" },
        },
      },
      ChatSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          sessionId: { type: "string", format: "uuid" },
          answer: { type: "string" },
          history: {
            type: "array",
            items: { $ref: "#/components/schemas/ChatMessage" },
          },
        },
      },
      HistorySuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          sessionId: { type: "string", format: "uuid" },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/ChatMessage" },
          },
        },
      },
    },
  },
};

export const swaggerUiHandler = swaggerUi.setup(openApiSpec, {
  customSiteTitle: "CNXH Chapter 6 API Docs",
});

export const swaggerServe = swaggerUi.serve;
