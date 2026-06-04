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

### Điều kiện (bắt buộc theo thứ tự)

1. **API đã chạy** và http://localhost:5000/health trả `{"success":true,...}`.
2. Đã cài ngrok: https://ngrok.com/download (hoặc `winget install Ngrok.Ngrok`).
3. Ngrok agent **≥ 3.20** (bản cũ sẽ báo lỗi khi đăng nhập).

### Mở ngrok bằng tay (từng bước)

**Bước 1 — Bật API trước** (cửa sổ PowerShell thứ nhất, để chạy nền):

```powershell
cd c:\code\thePrototype\cnxh-chapter6-chat-api
docker compose up -d
# hoặc: bun run dev
```

Mở trình duyệt: http://localhost:5000/health — phải thấy `"success":true`. Nếu chưa OK thì **chưa** chạy ngrok.

**Bước 2 — Lần đầu cài ngrok** (chỉ làm một lần):

1. Đăng ký: https://ngrok.com  
2. Lấy token: https://dashboard.ngrok.com/get-started/your-authtoken  
3. Trong PowerShell:

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ngrok.exe" config add-authtoken <DÁN_TOKEN_VÀO_ĐÂY>
```

**Bước 3 — Mở tunnel** (cửa sổ PowerShell **thứ hai**, giữ cửa sổ này **mở** — tắt là mất link):

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ngrok.exe" http 5000
```

Màn hình sẽ hiện dòng **Forwarding**, ví dụ:

```text
Forwarding   https://abc-xyz.ngrok-free.dev -> http://localhost:5000
```

**Bước 4 — Lấy link chia sẻ**

- Copy URL `https://....ngrok-free.dev` ở dòng Forwarding  
- Gửi cho bạn bè: `https://....ngrok-free.dev/api-docs`  
- Hoặc mở http://127.0.0.1:4040 trên máy bạn để xem tunnel

**Bước 5 — Dừng ngrok**

Trong cửa sổ đang chạy ngrok: nhấn `Ctrl + C`.

---

### Lệnh ngắn (đã cài token rồi)

```powershell
# Cập nhật ngrok nếu báo "agent version too old"
ngrok update

# Mở tunnel (API phải đang chạy port 5000)
ngrok http 5000
```

**Trên Windows**, nếu gõ `ngrok` báo *not recognized*, luôn dùng:

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ngrok.exe" http 5000
```

Xem URL public tại cửa sổ ngrok hoặc: http://127.0.0.1:4040

Ngrok in URL dạng `https://xxxx.ngrok-free.dev`. Chia sẻ:

```
https://xxxx.ngrok-free.dev/api-docs
```

Trình duyệt free tier có thể hiện trang cảnh báo — bấm **Visit Site**, hoặc gọi API kèm header `ngrok-skip-browser-warning: true`.

| Ưu | Nhược |
|----|--------|
| Không cần thuê server | URL free đổi mỗi lần chạy ngrok |
| Ai có link đều dùng được | Máy bạn phải bật + Docker/ngrok chạy |
| Chỉ expose port 5000 | Free tier có giới hạn bandwidth |

Ollama **không cần** expose ra ngoài — API gọi Ollama nội bộ trong Docker.

---

## Mang project lên máy trường / máy khác (checklist)

Dùng khi copy từ máy nhà sang phòng lab, máy bạn, máy demo...

### Bước 1 — Lấy code mới nhất

```powershell
git clone https://github.com/soloplayer345/cnxh-chapter6-chat-api.git
cd cnxh-chapter6-chat-api
# hoặc nếu đã clone: git pull
```

**Quan trọng:** Luôn dùng repo có `package-lock.json` đồng bộ với `package.json` (đã commit trên GitHub). Không chỉ copy thư mục bằng USB nếu thiếu file lock.

### Bước 2 — Chạy bằng Docker (khuyến nghị ở trường)

```powershell
# Bật Docker Desktop, đợi icon xanh
docker compose up -d --build
```

Kiểm tra:

```powershell
docker ps
# cnxh-chat-api phải STATUS = Up (không phải Restarting)
curl http://localhost:5000/health
```

### Bước 3 — Ngrok (nếu cần chia sẻ ra ngoài WiFi trường)

Chỉ chạy **sau** bước 2 thành công. Xem [Cách 4](#cách-4--public-ra-internet-bằng-ngrok).

### Bước 4 — Nếu lỗi

Xem mục [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp) bên dưới — đặc biệt các mục Docker `npm ci`, `entrypoint.sh`, ngrok, chat 503.

### Ghi chú môi trường trường

| Vấn đề | Gợi ý |
|--------|--------|
| Mạng trường chặn npm / SSL | Dùng Docker build (tải package trong container), không `npm install` trên host |
| Máy yếu RAM | Docker + Ollama cần ≥ 8 GB; chat chậm trên CPU là bình thường |
| Không cài được ngrok | Dùng [Cách 3 — LAN](#cách-3--cho-mọi-người-trong-cùng-wifi-lan) trong cùng WiFi phòng |

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

### Docker build: `npm ci` — package-lock.json không khớp

**Triệu chứng** khi `docker compose up --build`:

```text
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync
npm error Missing: swagger-ui-express@...
```

**Nguyên nhân:** Cài dependency bằng `bun install` trên máy dev nhưng chưa cập nhật `package-lock.json` (Docker dùng `npm ci`).

**Cách xử lý** (chạy tại thư mục project):

```powershell
# Cách 1: Cập nhật lock file bằng Docker (ổn định khi mạng trường lỗi SSL npm trên host)
docker run --rm -v "${PWD}:/app" -w /app node:22-alpine npm install

# Cách 2: Trên host (nếu npm chạy được)
npm install

# Sau đó build lại
docker compose up -d --build
```

Commit và push `package-lock.json` lên Git để máy khác không gặp lại.

### Docker: container `cnxh-chat-api` Restarting — `exec /entrypoint.sh: no such file or directory`

**Triệu chứng:** `docker ps` thấy API **Restarting**; ngrok tunnel mở nhưng vào link báo lỗi / không có phản hồi.

**Nguyên nhân:** File `docker/entrypoint.sh` bị lưu kiểu Windows (CRLF). Linux trong container không chạy được shebang `#!/bin/sh`.

**Cách xử lý:**

1. Pull code mới nhất (repo đã có `.gitattributes` cho `*.sh` và Dockerfile tự `sed` bỏ `\r`).
2. Build lại image:

```powershell
docker compose down
docker compose up -d --build
docker compose logs api --tail 20
# Phải thấy server listen port 5000, không còn lỗi entrypoint
```

Nếu vẫn lỗi trên máy clone cũ: mở `docker/entrypoint.sh` bằng VS Code/Cursor → góc dưới chọn **LF** (không phải CRLF) → lưu → build lại.

### Ngrok không chạy / tunnel không vào được API

| Triệu chứng | Cách xử lý |
|-------------|------------|
| `ngrok` is not recognized | Dùng `& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ngrok.exe" http 5000` hoặc mở terminal mới sau `winget install` |
| `agent version too old` | `ngrok update` (cần ≥ 3.20) |
| `Error reading configuration file` / thiếu `version` | `ngrok config upgrade` hoặc file config có `version: "2"` + `authtoken` |
| Tunnel mở nhưng link lỗi 502 / trống | API chưa chạy — kiểm tra http://localhost:5000/health trước |
| `x509: certificate signed by unknown authority` | Proxy/antivirus trường chặn HTTPS — thử mạng khác, tắt proxy, hoặc dùng LAN thay ngrok |
| Container API **Restarting** | Xem mục `entrypoint.sh` ở trên |

**Thứ tự đúng:** Docker/API health OK → rồi mới `ngrok http 5000`.

### Web FE deploy (Vercel, Netlify, …) không gọi được API ngrok

**Triệu chứng:** Trang web đã deploy báo lỗi mạng / CORS / `Failed to fetch` / JSON parse error (`Unexpected token '<'`).

**3 nguyên nhân hay gặp nhất:**

| # | Nguyên nhân | Cách sửa |
|---|-------------|----------|
| 1 | FE vẫn trỏ `localhost:5000` | Trên Vercel/Netlify set **`VITE_API_URL=https://xxxx.ngrok-free.dev`** rồi **build lại** (biến `VITE_*` gắn lúc build, không đổi sau deploy) |
| 2 | Thiếu header ngrok | Mọi request từ trình duyệt phải có header **`ngrok-skip-browser-warning: true`** (xem [doc/API-FRONTEND.md](./doc/API-FRONTEND.md)) |
| 3 | API/ngrok trên máy bạn tắt | Máy chạy Docker + ngrok phải **bật**; URL ngrok đổi mỗi lần mở → cập nhật env FE và build lại |

**Kiểm tra nhanh trên máy có API:**

1. Mở https://xxxx.ngrok-free.dev/health trên trình duyệt → thấy JSON OK.
2. Trên trang web deploy, F12 → Console, chạy:

```javascript
fetch("https://XXXX.ngrok-free.dev/health", {
  headers: { "ngrok-skip-browser-warning": "true" },
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

Nếu lệnh trên **OK** mà app vẫn lỗi → FE chưa cấu hình `VITE_API_URL` / header đúng.

**Code mẫu FE (bắt buộc khi dùng ngrok):**

```typescript
const API_BASE = import.meta.env.VITE_API_URL; // https://xxx.ngrok-free.dev

fetch(`${API_BASE}/api/ai/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  body: JSON.stringify({ message: "Xin chào" }),
});
```

**Sau khi sửa API (CORS):** `git pull` + `docker compose up -d --build` trên máy chạy backend.

**Cách khác (tránh CORS):** FE và API cùng WiFi → FE gọi `http://192.168.x.x:5000` (mục LAN), không qua ngrok.

---

**Nguyên nhân thường gặp với model `qwen3.5:0.8b`:** Bật chế độ *thinking* mặc định → Ollama xử lý cực chậm trên CPU.

Project đã cấu hình trong `src/services/ollama.service.ts`:

- `think: false`
- `options.num_predict: 512`

Sau khi `git pull`, build lại Docker hoặc restart `bun run dev`.

**Kiểm tra Ollama trong Docker:**

```powershell
docker compose logs ollama-init
docker compose exec ollama ollama list
```

Lần chat **đầu tiên** sau khi bật máy có thể ~20–40 giây (load model); các lần sau nhanh hơn.

### `npm install` trên Windows báo `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

Mạng/antivirus chặn chứng chỉ npm. **Không bắt buộc** nếu dùng Docker: build trong container (xem mục `npm ci` ở trên). Chạy local có thể dùng `bun install` thay `npm install`.

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

Dataset kiến thức Chương 6 (RAG, **41 mẫu** hỏi–đáp, có metadata `source` / `records`):

```
src/data/chuong_6_dan_toc_ton_giao_dataset.json
```

Sau khi đổi dataset: restart API hoặc `docker compose up -d --build` để Docker copy file mới vào image.

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

## Tài liệu cho Frontend

Team FE nối API xem: **[doc/API-FRONTEND.md](./doc/API-FRONTEND.md)** — base URL, request/response, `sessionId`, TypeScript types, ví dụ `fetch`/axios, timeout, ngrok.

Swagger thử nhanh: http://localhost:5000/api-docs

---

## Phụ lục — Log hỗ trợ AI

Thư mục [`doc/`](./doc/) ghi lại quá trình phát triển có hỗ trợ AI (Cursor), dùng làm phụ lục báo cáo/đồ án.

- [doc/API-FRONTEND.md](./doc/API-FRONTEND.md) — Hướng dẫn tích hợp API cho FE
- [doc/phu-luc-log-ai.md](./doc/phu-luc-log-ai.md) — Nhật ký chi tiết các bước AI hỗ trợ

---

## Giấy phép

MIT
