# LibrePuter

Bridge **500+ AI models** (OpenAI, Claude, Gemini, Grok, DeepSeek, and more) into **LibreChat** — powered by [Puter's User-Pays model](https://developer.puter.com).

Users provide their own Puter auth token as the API key. They pay for their own AI usage — you pay nothing. No API keys to manage on your end.

## How it works

```
LibreChat ──→ LibrePuter (proxy) ──→ api.puter.com
                :3090                    ↑
  User pastes Puter auth token ─────────╯
  as API key in LibreChat
```

1. User goes to [puter.com/dashboard](https://puter.com/dashboard) and copies their **Puter Auth Token**
2. Pastes it into LibreChat as the API key for the "Puter AI" custom endpoint
3. LibreChat sends `Authorization: Bearer <token>` to LibrePuter
4. LibrePuter forwards to `api.puter.com` — Puter charges the user, not you

## Quick Start

### 1. Install

```bash
cd path/to/LibrePuter
npm install
npm run build
```

### 2. Start the proxy

```bash
npm start
```

### 3. Add to LibreChat config

In your LibreChat's `librechat.yaml`:

```yaml
endpoints:
  custom:
    - name: "Puter AI"
      baseURL: "http://localhost:3090/api/puter/proxy/v1"
      apiKey: "user_provided"
      models:
        default: []
        fetch: true
      modelDisplayLabel: "Puter AI"
      titleConvo: true
```

### 4. Sign in

In LibreChat, select "Puter AI" as your endpoint. Paste your Puter Auth Token (from [puter.com/dashboard](https://puter.com/dashboard)) as the API key. All 500+ models become available.

## Modes

| Mode | Description | Users provide token? |
|------|-------------|-------------------|
| **Hosted** (default) | Proxies to `api.puter.com` | Yes — their own Puter token |
| **Self-hosted** | Proxies to your own Puter server (e.g., with Ollama) | Yes — their own Puter token |

Set mode via `LIBREPUTER_MODE` env var.

## Architecture

```
packages/
├── librechat-backend/    # Express proxy to api.puter.com
└── librechat-ui/         # React button linking to puter.com/dashboard
config/
├── librechat.yaml.example
└── puter.config.json.example
scripts/
└── setup.js
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/puter/proxy/v1/*` | ALL | Proxy AI requests to Puter (passes Authorization header through) |
| `/api/puter/models` | GET | List available models (public) |
| `/api/puter/models/details` | GET | List models with metadata (public) |

## License

AGPL-3.0