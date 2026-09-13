# ShareFlow Architecture & System Specification

ShareFlow is a high-performance, fault-tolerant device-to-device data and file sharing platform built on React, Node.js, Express, WebSockets, and Web Crypto API.

---

## System Overview

```
                        +-------------------------------------------------------+
                        |                    Client Device A                    |
                        | (React SPA + Web Crypto + Worker + IndexedDB + WS)    |
                        +---------------------------+---------------------------+
                                                    |
                                       HTTP / REST  | WS Events
                                       (Chunk Push) | (Control & Progress)
                                                    v
+---------------------------------------------------------------------------------------------------+
|                                          Nginx / Proxy                                            |
+---------------------------------------------------------------------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------+
|                                         Node.js Express App                                       |
|                                                                                                   |
|  +---------------------+  +----------------------+  +--------------------+  +------------------+  |
|  | Session Controller  |  | Transfer Controller  |  | WebSocket Handler  |  | Rate Limiter /   |  |
|  | (Code Gen & TTL)    |  | (Stream & Chunks)    |  | (State Sync)       |  | Disk Monitor     |  |
|  +----------+----------+  +----------+-----------+  +---------+----------+  +--------+---------+  |
+-------------|------------------------|------------------------|----------------------|------------+
              |                        |                        |                      |
              v                        v                        v                      v
+------------------------+  +----------------------+  +---------------------------------------------+
| Memory / Redis Store   |  | Temp Disk Storage    |  | Storage Cleanup Worker                      |
| (Session & Chunk Maps) |  | (Upload Chunks)      |  | (Periodic purge of expired / failed files)  |
+------------------------+  +----------------------+  +---------------------------------------------+
                                        |
                                        v HTTP Stream (Range Download)
                        +---------------+-----------------------+
                        |                    Client Device B                    |
                        | (React SPA + WS Listener + Downloader)|
                        +---------------------------------------+
```

---

## Core Protocol & Technical Design

### 1. Numeric Sharing Code Generation
- 6-digit random numeric codes generated using `crypto.randomInt(100000, 999999)`.
- Codes map to a unique internal `sessionId` UUID-v4. Internal IDs are never exposed in user URLs or UI.
- Strict rate limiting: 5 code attempts per minute per IP to defend against brute-force attacks (100,000 combinations).
- Configurable TTL: 10 minutes default (`SESSION_EXPIRY`).

### 2. Zero Data Loss Chunked Transfer Protocol
- **Chunking**: Files are sliced on the client using `Blob.slice()` into 2 MB chunks.
- **Off-Thread SHA-256 Hashing**: Web Worker computes SHA-256 checksum for each chunk off the main UI thread.
- **Direct-to-Disk Stream Writing**: Node.js receives chunks and writes them directly to temporary storage at exact file offsets (`fs.promises.open` + `writeSync` at `offset = chunkIndex * chunkSize`). Memory footprint remains constant (`O(1)` RAM <50 MB) regardless of file size (e.g. 10 GB file).
- **Per-Chunk Verification**: Server computes SHA-256 on incoming chunk stream and matches against `x-chunk-hash` header.
- **Automatic Resumption**: In case of network interruption, client queries `GET /api/transfer/:id/status` and resumes uploading from the first unacknowledged chunk index.
- **Final SHA-256 Verification**: Server computes stream SHA-256 on completed disk file and validates against client original file hash before marking transfer `COMPLETED`.

---

## WebSocket Events

| Event Type | Direction | Description |
|---|---|---|
| `JOIN_SESSION` | Client -> Server | Binds WebSocket to active session as `host` or `guest` |
| `SESSION_CONNECTED` | Server -> Client | Confirms socket session binding |
| `DEVICE_JOINED` | Server -> Client | Notifies peer that recipient joined |
| `TRANSFER_INIT` | Client -> Server -> Client | Signals file/text transfer offer metadata |
| `TRANSFER_PROGRESS` | Client -> Server -> Client | Real-time upload percentage & speed updates |
| `CHUNK_ACK` | Server -> Client | Acknowledges receipt of individual chunk |
| `TRANSFER_COMPLETE` | Client -> Server -> Client | Signals verified file transfer completion |
| `PING` / `PONG` | Bi-directional | Heartbeat ping every 25s to detect dropped sockets |

---

## Security & Resource Protection

1. **Anti Brute-Force**: IP rate limiters on `/api/session/join` (max 5 attempts/min).
2. **Disk Safety Monitor**: Node.js checks disk partition space before accepting uploads. Returns `503 Storage Capacity Exceeded` if free disk space is less than 500 MB.
3. **Automatic Storage Cleanup**: Background worker runs every 60 seconds purging orphaned temporary `.tmp` upload files older than 1 hour.
4. **Graceful Shutdown**: Server handles `SIGTERM` and `SIGINT`, stops accepting new requests, flushes pending WebSocket frames, and closes connections cleanly.
