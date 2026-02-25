# MCP Server built with mcp-use

This is an MCP server project bootstrapped with [`create-mcp-use-app`](https://mcp-use.com/docs/typescript/getting-started/quickstart).

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000/inspector](http://localhost:3000/inspector) with your browser to test your server.

### Backend MCPs (Agent Chat, Music, YouTube)

**Option A: Deployed URLs** — Set env vars and the orchestrator will use your deployed MCPs (widgets will render from their servers):

```bash
export AGENT_CHAT_MCP_URL=https://your-agent-chat.deployments.mcp-agent.com/mcp
export MUSIC_PLAYER_MCP_URL=https://your-music-player.deployments.mcp-agent.com/mcp
export YOUTUBE_MCP_URL=https://your-youtube.deployments.mcp-agent.com/mcp
npm run dev
```

Or add them to `.env` (copy from `.env.example`).

**Option B: Local** — Run each in a separate terminal (falls back when env vars are unset):

```bash
# Terminal 1: Agent Chat (port 4000)
cd agent-chat-mcp && npm run dev

# Terminal 2: Music Player (port 5000)
cd music-player-mcp && npm run dev

# Terminal 3: YouTube (port 3001)
cd ../video-yt-repo && PORT=3001 npm run dev

# Terminal 4: Main orchestrator (port 3000)
cd .. && npm run dev
```

You can start building by editing the entry file. Add tools, resources, and prompts — the server auto-reloads as you edit.

## Learn More

To learn more about mcp-use and MCP:

- [mcp-use Documentation](https://mcp-use.com/docs/typescript/getting-started/quickstart) — guides, API reference, and tutorials

## Deploy on Manufact Cloud

```bash
npm run deploy
```
