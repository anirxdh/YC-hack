# Lark

**AI should do things, not just say things.**

---

## Problem

AI lives in a chat box. You type, it replies, you copy-paste the answer somewhere else. Meanwhile, every real action — calling someone, playing music, watching a video, messaging a friend — requires leaving the conversation and opening a separate app.

There's no way for AI to *actually do things* on your behalf, in one place.

## Solution

Lark is an MCP-powered app that turns ChatGPT and Claude into an action interface. Instead of just a text box, Lark presents a phone-like home screen directly inside the AI chat — where users can open apps that trigger real-world actions.

The user says "call Mom" and a call happens. They say "play Bohemian Rhapsody" and music plays. They say "send a message to Claude" and an actual cross-model conversation starts. No copy-paste. No tab switching. One interface.

## Key Features

- **Phone Call** — Make real phone calls via Twilio, directly from the AI chat. Supports contacts by name.
- **YouTube** — Search, open, and summarize YouTube videos inline.
- **Music** — Search and play songs from Audius and Deezer with full playback controls.
- **Messages** — A cross-model messaging app. ChatGPT can send messages to Claude (and vice versa), enabling LLM-to-LLM and human-to-LLM collaboration in one thread.
- **Group Calls** — Call multiple contacts simultaneously with a single command. "Call Anirudh, Raj, and Priya and say I'm running late" — all calls fire in parallel via Twilio.

## How It Works

Lark is built on a single MCP orchestrator that connects to multiple backend MCP servers, discovers their tools at startup, and exposes them through one unified gateway. The frontend is a React widget rendered inside the AI chat via `mcp-use`.

```
┌─────────────────────────────────────────────┐
│              User / ChatGPT / Claude        │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                  Lark UI                    │
│         (React widget inside chat)          │
│                                             │
│   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│   │ Phone │ │YouTube│ │ Music │ │  Msgs │  │
│   └───────┘ └───────┘ └───────┘ └───────┘  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│            Lark Orchestrator                │
│     (MCP server + tool router + proxy)      │
│                                             │
│  • Connects to backend MCP servers on boot  │
│  • Namespaces & re-exposes their tools      │
│  • Hosts local tools (calls, music, etc.)   │
│  • Proxies audio/image streams              │
└──────┬──────────┬───────────┬───────────────┘
       │          │           │
       ▼          ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌───────────┐
  │ YouTube │ │  Agent   │ │  Video-YT │
  │   MCP   │ │  Chat    │ │    MCP    │
  │ Server  │ │  MCP     │ │  Server   │
  └─────────┘ └─────────┘ └───────────┘
```

**Flow:** User taps an app in the Lark UI → the widget calls an MCP tool → the orchestrator routes it to the right backend (or handles it locally) → result renders back in the UI. All within the chat window.

## Demo

### Waking Up Lark
If the videos dont play - check this out for a quick demo
https://drive.google.com/drive/folders/1OxQ6hvENkcpAdem1iac4vjjKl_E6WxuM

Say "wake up Lark" and the full phone-like home screen appears inside the chat.

https://github.com/user-attachments/assets/Video-Wakeup-demo.mov

### Live Phone Call

Making a real phone call to a saved contact — directly from ChatGPT.

https://github.com/user-attachments/assets/Live-call-demo.mp4

### Multi-Agent Interaction

ChatGPT sends a message to another AI agent and gets a response — cross-model collaboration in one thread.

https://github.com/user-attachments/assets/Multi-agent-interaction.mov

## Why This Matters

MCP gives AI the ability to use tools. But right now, each tool is a separate integration — no unified interface, no coordination, no shared context.

Lark is the missing layer: a single orchestrator that aggregates multiple MCP servers behind one UI, turning a chat window into an operating system for AI actions. The five apps are examples. The real product is the orchestration pattern — any MCP-compatible tool can plug in.

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestrator | TypeScript, `mcp-use` server SDK |
| Frontend / Widgets | React 19, Tailwind CSS, `mcp-use/react` |
| Phone Calls | Twilio Voice API |
| Music | Audius API, Deezer API (search + stream) |
| YouTube | External MCP servers (YouTube, Video-YT) |
| Cross-model Messaging | Agent Chat MCP server |
| Build | Vite, TSX |

## Future Work

- **More apps** — Calendar, email, smart home, payments
- **Persistent state** — Conversation memory and preferences across sessions
- **Multi-user** — Shared Lark sessions between people and AI agents
- **Voice-first** — Full voice control so users never need to type
- **App store** — Let developers publish MCP tools as Lark apps

## OAuth Authentication

Lark uses OAuth to securely connect to ChatGPT and Claude. When adding Lark as a custom MCP app, users authenticate through a standard OAuth flow — no API keys pasted into chat.

![Lark OAuth setup in ChatGPT](public/readme-oauth.png)

## Repos

Lark is composed of multiple MCP servers coordinated by a single orchestrator:

| App | Repo |
|---|---|
| YouTube / Video | [rashmi-star/video-yt](https://github.com/rashmi-star/video-yt) |
| Music | [rashmi-star/music-mcp](https://github.com/rashmi-star/music-mcp) |
| Cross-model Messages | [rashmi-star/message-agent](https://github.com/rashmi-star/message-agent) |

## Try It Live

Connect Lark to ChatGPT or Claude using the hosted MCP server URL:

```
https://odd-dust-kiili.run.mcp-use.com/mcp
```

Add this as a custom MCP app (with OAuth authentication) — no local setup required.

## Getting Started (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000/inspector](http://localhost:3000/inspector) to test locally.

### Environment Variables

```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Deploy

```bash
npm run deploy
```

---

### Hackathon Description

> Lark turns ChatGPT and Claude into an action interface — not just a chat box. It presents a phone-like home screen inside the AI chat where users can make calls, play music, watch YouTube, and message across models. Under the hood, a single MCP orchestrator connects to multiple tool servers and coordinates them behind one unified UI. The apps are examples; the core innovation is the orchestration layer.

---

Built with [mcp-use](https://mcp-use.com)
