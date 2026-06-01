# CNXH Chapter 6 Chat API

Chatbot hỏi đáp **Chương 6 — Vấn đề dân tộc và tôn giáo** (môn Chủ nghĩa xã hội khoa học).

API backend dùng **Express + TypeScript**, sinh câu trả lời qua **Ollama**, lưu lịch sử chat vào **file JSON**. Có **Swagger UI** để test API trực quan.

---

## Yêu cầu hệ thống

| Thành phần | Ghi chú |
|------------|---------|
| **Node.js ≥ 18** hoặc **Bun** | Chạy local |
| **Docker Desktop** | Khuyến nghị khi deploy cho nhiều người |
| **Ollama** | Chỉ cần cài trên máy khi chạy local (Docker tự cài Ollama) |
| **RAM** | Nên ≥ 8 GB khi chạy Ollama trên CPU |

---

## Cấu trúc project

```
cnxh-chapter6-chat-api/
├── src/
│   ├── app.ts                 # Express app, Swagger
│   ├── server.ts              # Entry point
│   ├── config/swagger.ts      # OpenAPI spec
│   ├── controllers/           # HTTP handlers
│   ├── routes/                # API routes
│   ├── services/              # AI, Ollama, chat history, dataset
│   └── data/                  # Dataset + lịch sử chat (JSON)
├── docker-compose.yml         # API + Ollama
├── Dockerfile
├── doc/                       # Phụ lục, log hỗ trợ AI
└── README.md
```

---

## API endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/health` | Kiểm tra server |
| GET | `/api-docs` | Swagger UI |
| GET | `/api-docs.json` | OpenAPI JSON |
| POST | `/api/ai/chat` | Gửi tin nhắn chat |
| GET | `/api/ai/history/:sessionId` | Lấy lịch sử phiên |
| DELETE | `/api/ai/history/:sessionId` | Xóa lịch sử phiên |

**POST /api/ai/chat** — body:

```json
{
  "message": "Giải thích vấn đề dân tộc trong CNXH khoa học",
  "sessionId": "optional-uuid-de-tiep-tuc-hoi-thoai"
}
```

---

## Cách 1 — Chạy local (dev)

### Bước 1: Cài dependency

```powershell
bun install
# hoặc: npm install
```

### Bước 2: Cấu hình môi trường

```powershell
copy .env.example .env
```

Chỉnh `.env` nếu cần:

```env
PORT=5000
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=qwen3.5:0.8b
```

### Bước 3: Cài và chạy Ollama (ngoài Docker)

1. Tải Ollama: https://ollama.com
2. Pull model:

```powershell
ollama pull qwen3.5:0.8b
```

3. Đảm bảo Ollama đang chạy (mặc định port `11434`).

### Bước 4: Chạy API

```powershell
# Dev (hot reload)
bun run dev

# Production
bun run build
bun run start
```

### Bước 5: Kiểm tra

- Health: http://localhost:5000/health
- Swagger: http://localhost:5000/api-docs

---

## Cách 2 — Deploy bằng Docker (khuyến nghị)

Docker Compose tự chạy **API + Ollama + pull model**. Không cần cài Ollama trên máy host.

### Bước 1: Bật Docker Desktop

### Bước 2: Build và chạy

```powershell
docker compose up -d --build
```

Hoặc:

```powershell
bun run docker:up
```

**Lần đầu** có thể mất vài phút để tải model `qwen3.5:0.8b`.

### Bước 3: Xem log

```powershell
docker compose logs -f ollama-init   # tiến trình tải model
docker compose logs -f api           # log API
bun run docker:logs
```

### Bước 4: Kiểm tra

- http://localhost:5000/health
- http://localhost:5000/api-docs

### Dừng / xóa container

```powershell
docker compose down
bun run docker:down
```

### Dữ liệu lưu ở đâu?

| Volume Docker | Nội dung |
|---------------|----------|
| `ollama_data` | Model Ollama |
| `api_data` | Lịch sử chat (`chat-history.json`) |

Dataset Chương 6 được copy vào image khi build; lịch sử chat ghi vào volume `api_data`.

---

## Cách 3 — Cho mọi người trong cùng WiFi (LAN)

1. Chạy Docker (Cách 2) hoặc local (Cách 1).
2. Lấy IP máy chủ:

```powershell
ipconfig
```

Tìm **IPv4 Address** (vd. `192.168.1.50`).

3. Mọi người cùng mạng truy cập:

```
http://192.168.1.50:5000/api-docs
```

**Lưu ý:** Mở port **5000** trên Windows Firewall nếu máy khác không vào được.

---

## Cách 4 — Public ra internet bằng ngrok

Dùng khi không thuê VPS nhưng muốn bạn bè/lớp truy cập từ xa (4G, mạng khác).

### Điều kiện

- API đang chạy tại `localhost:5000` (Docker hoặc local).
- Đã cài ngrok: https://ngrok.com/download

### Các bước

```powershell
# Lần đầu: đăng ký ngrok, lấy authtoken
ngrok config add-authtoken <TOKEN>

# Mở tunnel
ngrok http 5000
```

Ngrok in URL dạng `https://xxxx.ngrok-free.app`. Chia sẻ:

```
https://xxxx.ngrok-free.app/api-docs
```

| Ưu | Nhược |
|----|--------|
| Không cần thuê server | URL free đổi mỗi lần chạy ngrok |
| Ai có link đều dùng được | Máy bạn phải bật + Docker/ngrok chạy |
| Chỉ expose port 5000 | Free tier có giới hạn bandwidth |

Ollama **không cần** expose ra ngoài — API gọi Ollama nội bộ trong Docker.

---

## Xử lý lỗi thường gặp

### `EADDRINUSE: port 5000`

Port đã bị chiếm (thường do chạy `dev` và `start` cùng lúc).

```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Hoặc đổi `PORT=5001` trong `.env`.

### `503 — Cannot connect to Ollama`

- **Local:** Kiểm tra Ollama đang chạy, model đã pull.
- **Docker:** `docker compose logs ollama` và `docker compose logs ollama-init`.

### Docker Desktop không chạy

Lỗi `dockerDesktopLinuxEngine: The system cannot find the file specified` → mở **Docker Desktop** rồi chạy lại `docker compose up`.

### Chat chậm

Model chạy CPU sẽ chậm hơn GPU. Giảm tải bằng cách hạn chế số người chat đồng thời.

---

## Biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `PORT` | `5000` | Port API |
| `OLLAMA_URL` | `http://localhost:11434/api/generate` | URL Ollama generate |
| `OLLAMA_MODEL` | `qwen3.5:0.8b` | Tên model |

Docker Compose tự ghi đè `OLLAMA_URL=http://ollama:11434/api/generate`.

---

## Lưu trữ dữ liệu

Project **không dùng database**. Lịch sử chat lưu file:

```
src/data/chat-history.json
```

(trong Docker: volume `api_data`)

Dataset kiến thức Chương 6:

```
src/data/chuong_6_dan_toc_ton_giao_dataset.json
```

---

## Scripts npm/bun

| Lệnh | Mô tả |
|------|--------|
| `bun run dev` | Chạy dev với hot reload |
| `bun run build` | Compile TypeScript |
| `bun run start` | Chạy bản build |
| `bun run docker:up` | Docker Compose up |
| `bun run docker:down` | Docker Compose down |
| `bun run docker:logs` | Xem log API |

---

## Phụ lục — Log hỗ trợ AI

Thư mục [`doc/`](./doc/) ghi lại quá trình phát triển có hỗ trợ AI (Cursor), dùng làm phụ lục báo cáo/đồ án.

- [doc/phu-luc-log-ai.md](./doc/phu-luc-log-ai.md) — Nhật ký chi tiết các bước AI hỗ trợ

---

## Giấy phép

MIT
