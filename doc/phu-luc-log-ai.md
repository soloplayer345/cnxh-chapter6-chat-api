# Phụ lục — Nhật ký hỗ trợ AI (Cursor Agent)

**Dự án:** CNXH Chapter 6 Chat API  
**Công cụ AI:** Cursor IDE — Agent  
**Mục đích phụ lục:** Ghi lại các bước phát triển có sự hỗ trợ của AI, phục vụ minh bạch quy trình và báo cáo đồ án.

---

## 1. Tổng quan

| Hạng mục | Chi tiết |
|----------|----------|
| Ngôn ngữ / stack | TypeScript, Express, Ollama, file JSON |
| Phạm vi AI hỗ trợ | Cấu hình Swagger, Docker deploy, tài liệu, tư vấn kiến trúc |
| Phạm vi không thay đổi bởi AI | Logic nghiệp vụ chat, dataset Chương 6, prompt AI gốc |

---

## 2. Nhật ký theo thời gian

### Mục 2.1 — Khám phá cách chạy project (Swagger & Bun)

**Yêu cầu người dùng:** Hỏi project có chạy được Swagger không và dùng Bun.

**Phân tích AI:**
- Đọc `package.json`, `src/app.ts`, routes — xác nhận **chưa có Swagger**.
- Project chỉ là REST API Express; endpoint liệt kê tại `GET /`.
- Có `bun.lock` → tương thích Bun.

**Kết quả / hướng dẫn:**
- Chạy: `bun install`, `bun run dev` hoặc `bun --watch src/server.ts`.
- Test API bằng curl/Postman vì chưa có Swagger.
- Lưu ý cần Ollama local cho `POST /api/ai/chat`.

**File liên quan:** `package.json`, `src/app.ts`, `src/routes/ai.routes.ts`, `.env.example`

---

### Mục 2.2 — Xử lý lỗi port 5000 bị chiếm

**Yêu cầu người dùng:** Gửi log lỗi `EADDRINUSE :::5000`.

**Phân tích AI:**
- Chạy `netstat -ano | findstr :5000` → PID `39036`.
- `tasklist` xác định process `node.exe` (instance server cũ).

**Hành động:**
- `taskkill /PID 39036 /F` để giải phóng port.

**Kết quả:**
- Hướng dẫn tránh chạy đồng thời `dev` và `start`; hoặc đổi `PORT` trong `.env`.

---

### Mục 2.3 — Tích hợp Swagger UI

**Yêu cầu người dùng:** API chạy được nhưng thiếu Swagger, khó test.

**Hành động AI (thay đổi mã nguồn):**

| File | Thay đổi |
|------|----------|
| `src/config/swagger.ts` | **Tạo mới** — OpenAPI 3.0 spec + Swagger UI |
| `src/app.ts` | Mount `/api-docs`, `/api-docs.json`; load `dotenv` sớm |
| `src/server.ts` | In URL Swagger khi khởi động |
| `package.json` | Thêm `swagger-ui-express`, `@types/swagger-ui-express` |

**Kết quả:**
- Swagger UI: `http://localhost:5000/api-docs`
- Build TypeScript thành công (`bun run build`).

---

### Mục 2.4 — Làm rõ cơ chế lưu trữ dữ liệu

**Yêu cầu người dùng:** Project có lưu database không?

**Phân tích AI:**
- Đọc `src/services/chatHistory.service.ts` — dùng `fs` ghi `chat-history.json`.
- Grep toàn project: không có MongoDB, PostgreSQL, Prisma, SQLite.

**Kết quả:**
- **Không có DB** — persistence bằng file JSON tại `src/data/`.
- Nêu ưu/nhược cho deploy production.

---

### Mục 2.5 — Tư vấn deploy cho nhiều người dùng

**Yêu cầu người dùng:** Có thể tự deploy cho mọi người dùng không?

**Phân tích AI:**
- Backend-only, phụ thuộc Ollama, lưu file JSON, không auth.
- Đề xuất: VPS + Ollama, Docker Compose, hoặc PaaS (khó với Ollama).

**Kết quả:** Tư vấn kiến trúc — chưa sửa code.

---

### Mục 2.6 — Thiết lập Docker Compose (chỉ có Docker, không thuê server)

**Yêu cầu người dùng:** Chỉ có Docker, không thuê deploy ngoài.

**Hành động AI (thay đổi mã nguồn):**

| File | Thay đổi |
|------|----------|
| `Dockerfile` | **Tạo mới** — multi-stage build Node 22 Alpine |
| `docker-compose.yml` | **Tạo mới** — services: `ollama`, `ollama-init`, `api` |
| `docker/entrypoint.sh` | **Tạo mới** — copy dataset, khởi tạo `chat-history.json` |
| `.dockerignore` | **Tạo mới** |
| `.env.example` | Ghi chú biến Docker |
| `package.json` | Scripts `docker:up`, `docker:down`, `docker:logs` |

**Kiến trúc Docker:**

```
Internet/LAN → host:5000 → container api → container ollama
                              ↓
                         volume api_data (lịch sử chat)
                         volume ollama_data (model)
```

**Kết quả:**
- Một lệnh: `docker compose up -d --build`
- Lần đầu tự pull model `qwen3.5:0.8b`
- Người cùng LAN truy cập qua IP máy chủ.

**Ghi chú:** Build Docker trên môi trường dev bị chặn khi Docker Desktop chưa bật — hướng dẫn user bật Docker trước.

---

### Mục 2.7 — Public internet bằng ngrok

**Yêu cầu người dùng:** Có dùng ngrok được không?

**Phân tích AI:**
- Chỉ cần tunnel port `5000`; Ollama nội bộ Docker không cần expose.
- Lệnh: `ngrok http 5000` → chia sẻ `https://xxx.ngrok-free.app/api-docs`.

**Kết quả:** Tư vấn — chưa thêm ngrok vào `docker-compose.yml`.

---

### Mục 2.8 — Viết README và thư mục phụ lục (mục này)

**Yêu cầu người dùng:** Viết README hướng dẫn deploy + folder `doc` log AI làm phụ lục.

**Hành động AI:**

| File | Thay đổi |
|------|----------|
| `README.md` | **Tạo mới** — hướng dẫn local, Docker, LAN, ngrok |
| `doc/README.md` | **Tạo mới** — mục lục phụ lục |
| `doc/phu-luc-log-ai.md` | **Tạo mới** — file này |

---

## 3. Tóm tắt file do AI tạo / sửa

### File tạo mới

- `src/config/swagger.ts`
- `Dockerfile`
- `docker-compose.yml`
- `docker/entrypoint.sh`
- `.dockerignore`
- `README.md`
- `doc/README.md`
- `doc/phu-luc-log-ai.md`

### File chỉnh sửa

- `src/app.ts`
- `src/server.ts`
- `package.json`
- `.env.example`

### File không thay đổi (logic nghiệp vụ gốc)

- `src/services/ai.service.ts`
- `src/services/ollama.service.ts`
- `src/services/dataset.service.ts`
- `src/services/chatHistory.service.ts`
- `src/data/chuong_6_dan_toc_ton_giao_dataset.json`

---

## 4. Cam kết sử dụng AI (mẫu trích báo cáo)

> Trong quá trình hoàn thiện phần triển khai và tài liệu, nhóm có sử dụng công cụ **Cursor Agent** để: (1) tích hợp Swagger UI; (2) thiết lập Docker Compose; (3) soạn README và phụ lục. Toàn bộ logic chatbot, dataset và prompt vẫn do nhóm phát triển ban đầu. Nhóm đã review, chạy thử và chịu trách nhiệm về nội dung nộp bài.

---

## 5. Checklist sau khi AI hỗ trợ (dành cho sinh viên)

- [ ] Đọc và hiểu các file AI tạo (`swagger.ts`, `Dockerfile`, `docker-compose.yml`)
- [ ] Chạy thử local: `bun run dev` + Ollama
- [ ] Chạy thử Docker: `docker compose up -d --build`
- [ ] Test Swagger: `POST /api/ai/chat` với câu hỏi mẫu
- [ ] (Tuỳ chọn) Test ngrok cho người dùng từ xa
- [ ] Cập nhật báo cáo: trích phụ lục này nếu quy định môn học yêu cầu

---

*Tài liệu được tổng hợp từ phiên làm việc Cursor Agent — cập nhật lần cuối theo yêu cầu viết README và phụ lục.*
