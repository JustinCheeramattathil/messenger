# Chat Backend

Real-time chat API built with **Express**, **Socket.IO**, **MongoDB (Mongoose)** and **JWT** auth.

## Features

- JWT authentication (access + refresh tokens), password hashing with bcrypt
- Users directory (search) to start new conversations
- 1:1 conversations with denormalized "last message" for fast list rendering
- Message history with cursor pagination (`?before=&limit=`)
- Real-time messaging, typing indicators, read receipts and online presence over Socket.IO
- Centralized validation (Joi), error handling and a uniform response envelope

## Requirements

- Node.js 18+
- MongoDB (local, Docker, or Atlas) — **or** the built-in in-memory DB for development

## Getting started

```bash
cd backend
cp .env.example .env        # adjust secrets / Mongo URI as needed
npm install
```

### Run with your own MongoDB

```bash
# start MongoDB however you like, e.g. via the bundled docker-compose:
docker compose up -d
npm run seed                # optional: demo users + a sample conversation
npm run dev                 # http://localhost:5050
```

### Run with zero setup (in-memory MongoDB)

```bash
npm run dev:memory          # spins up an ephemeral in-memory MongoDB
```

> The in-memory database is great for trying things out but data is wiped on
> restart. Use a real MongoDB for anything persistent.

### Demo accounts (after `npm run seed`)

| Email           | Password    |
| --------------- | ----------- |
| alice@chat.dev  | password123 |
| bob@chat.dev    | password123 |
| carol@chat.dev  | password123 |

## REST API

Base URL: `/api/v1`. All protected routes require `Authorization: Bearer <accessToken>`.

| Method | Endpoint                          | Auth | Description                          |
| ------ | --------------------------------- | ---- | ------------------------------------ |
| GET    | `/health`                         | —    | Health check                         |
| POST   | `/auth/register`                  | —    | Create account → `{ user, tokens }`  |
| POST   | `/auth/login`                     | —    | Login → `{ user, tokens }`           |
| POST   | `/auth/refresh-tokens`            | —    | Exchange refresh token for new pair  |
| GET    | `/auth/me`                        | ✅   | Current user                         |
| GET    | `/users?search=`                  | ✅   | List other users                     |
| GET    | `/users/:id`                      | ✅   | Get a user                           |
| GET    | `/conversations`                  | ✅   | My conversations (with last message) |
| POST   | `/conversations`                  | ✅   | Find-or-create 1:1 `{ participantId }` |
| GET    | `/conversations/:id`              | ✅   | Get a conversation                   |
| GET    | `/conversations/:id/messages`     | ✅   | Message history `?before=&limit=`    |
| POST   | `/conversations/:id/messages`     | ✅   | Send a message `{ text }`            |

Responses use a uniform envelope:

```json
{ "success": true, "message": "Logged in", "data": { } }
```

## Socket.IO

Connect with the access token in the handshake:

```js
io('http://localhost:5050', { auth: { token: accessToken } });
```

### Client → server

| Event              | Payload                          | Notes                         |
| ------------------ | -------------------------------- | ----------------------------- |
| `conversation:join`  | `{ conversationId }`           | Join a room                   |
| `conversation:leave` | `{ conversationId }`           | Leave a room                  |
| `message:send`     | `{ conversationId, text }`       | Acked with `{ status, message }` |
| `typing:start`     | `{ conversationId }`             |                               |
| `typing:stop`      | `{ conversationId }`             |                               |
| `message:read`     | `{ conversationId }`             | Marks messages read           |

### Server → client

| Event              | Payload                                          |
| ------------------ | ------------------------------------------------ |
| `message:new`      | The created message (with populated sender)      |
| `typing`           | `{ conversationId, userId, isTyping }`           |
| `message:read`     | `{ conversationId, userId }`                     |
| `presence:update`  | `{ userId, isOnline, lastSeen }`                 |

## Project structure

```
src/
├── config/        # env + database connection
├── controllers/   # request handlers (thin)
├── middlewares/   # auth, validation, error handling
├── models/        # Mongoose schemas
├── routes/        # Express routers
├── services/      # shared business logic (used by REST + sockets)
├── socket/        # Socket.IO setup, auth and chat handlers
├── utils/         # tokens, errors, response helpers, logger
├── validations/   # Joi schemas
├── app.js         # Express app assembly
└── index.js       # HTTP + Socket.IO bootstrap
```
# messenger
