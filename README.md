# LibrePuter

**LibreChat** with **Puter AI** built-in — 500+ AI models, user-pays, no API keys to manage.

A fork of [LibreChat](https://github.com/danny-avila/LibreChat) that adds Puter AI as a pre-configured custom endpoint. Users paste their Puter auth token (from [puter.com/dashboard](https://puter.com/dashboard)) as the API key and get access to all Puter-hosted models (OpenAI, Claude, Gemini, Grok, DeepSeek, Qwen, and more).

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [MongoDB](https://www.mongodb.com/) running locally or remotely

### Setup

```bash
cd path/to/LibrePuter

# Copy and edit environment variables
cp .env.example .env
# At minimum, set MONGO_URI to your MongoDB connection string

# Install dependencies
npm install

# Build the frontend
npm run frontend

# Start
npm start
```

Open [http://localhost:3080](http://localhost:3080) in your browser. Create an account, select **Puter AI** from the endpoint dropdown, paste your Puter auth token, and start chatting.

### Getting your Puter token

1. Go to [puter.com/dashboard](https://puter.com/dashboard)
2. Sign in (or create a free account)
3. Copy your Puter Auth Token
4. In LibreChat, select "Puter AI" as the endpoint
5. Paste the token as the API key

## Configuration

LibrePuter supports all [LibreChat configuration options](https://www.librechat.ai/docs/configuration/librechat_yaml). The Puter AI custom endpoint is pre-configured in `librechat.yaml`:

```yaml
endpoints:
  custom:
    - name: 'Puter AI'
      apiKey: 'user_provided'
      baseURL: 'http://localhost:3080/api/puter/proxy/v1'
      models:
        default: []
        fetch: true
      titleConvo: true
      modelDisplayLabel: 'Puter AI'
```

## Architecture

```
Browser → LibrePuter (port 3080)
             ├── LibreChat SPA (React UI)
             ├── LibreChat API (auth, users, convos, etc.)
             └── /api/puter/* (proxies to api.puter.com)
```

## Puter API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/puter/models` | List available models |
| `GET /api/puter/models/details` | List models with metadata |
| `ALL /api/puter/proxy/v1/*` | Proxy AI requests to Puter (passthrough auth) |

## License

AGPL-3.0