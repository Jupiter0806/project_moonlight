# Moonlight Server

HTTP API server for Project Moonlight. Built with [Hono](https://hono.dev/) + [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) + [Google Gemini AI](https://ai.google.dev/).

## Stack

| Concern        | Technology                   |
| -------------- | ---------------------------- |
| Framework      | Hono (Node.js adapter)       |
| Database       | Firestore                    |
| Authentication | Firebase Auth (Bearer token) |
| AI             | Google Gemini 2.0 Flash      |
| Deployment     | Cloud Run                    |
| Local dev      | Firebase Emulator Suite      |

## API Endpoints

All endpoints are prefixed with `/api` and require an `Authorization: Bearer <firebase-id-token>` header.

| Method | Path               | Description                                        |
| ------ | ------------------ | -------------------------------------------------- |
| `GET`  | `/api/reflections` | List reflections (cursor paginated)                |
| `POST` | `/api/reflection`  | Create a new reflection                            |
| `GET`  | `/api/traces`      | List traces for a reflection (cursor paginated)    |
| `GET`  | `/api/answer`      | Ask a question, get an AI answer + persisted trace |
| `GET`  | `/health`          | Health check (no auth required)                    |

See [../README.md](../README.md) for full query parameter and response shapes.

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 9+
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Docker & Docker Compose (optional, for containerised local dev)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in your values
cp .env.example .env
```

Required env vars (see `.env.example` for full list):

| Variable                              | Description                          |
| ------------------------------------- | ------------------------------------ |
| `FIREBASE_PROJECT_ID`                 | Your Firebase project ID             |
| `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` | Service account JSON, base64-encoded |
| `GEMINI_API_KEY`                      | Google AI Studio API key             |
| `USE_FIREBASE_EMULATOR`               | Set to `true` to use local emulators |

### Run with Firebase Emulators (recommended for development)

```bash
# Terminal 1: start Firebase emulators
firebase emulators:start --only auth,firestore --project demo-moonlight

# Terminal 2: start the server
USE_FIREBASE_EMULATOR=true pnpm dev
```

Server runs at `http://localhost:3001`.
Emulator UI at `http://localhost:4000`.

### Run with Docker Compose

```bash
# Requires GEMINI_API_KEY set in your shell or a .env file
docker compose up --build
```

### Scripts

```bash
pnpm dev      # Start with hot reload (tsx watch)
pnpm build    # Compile TypeScript to dist/
pnpm start    # Run compiled output (production)
pnpm lint     # ESLint
pnpm format   # Prettier
pnpm test     # Jest unit tests
```

## Testing

Unit tests mock both the Firebase Admin SDK and Gemini client:

```bash
pnpm test
```

Tests live in `tests/services/`.

## Deployment (Cloud Run)

```bash
# Build and push image
gcloud builds submit --tag gcr.io/<PROJECT_ID>/moonlight-server

# Deploy
gcloud run deploy moonlight-server \
  --image gcr.io/<PROJECT_ID>/moonlight-server \
  --region us-central1 \
  --set-env-vars FIREBASE_PROJECT_ID=<id>,GEMINI_API_KEY=<key>,...
```

Inject `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` via a Secret Manager secret for security.

## Security Notes

- `user_id` query parameters are validated against the authenticated token UID — mismatches return `403`.
- Service account key is base64-encoded and injected at runtime; never committed to the repo.
- CORS is restricted to `ALLOWED_ORIGIN` env var (defaults to `http://localhost:3000`).
