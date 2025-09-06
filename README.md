<div align="center">

# 🍌 Bananas — Reddit Image Alchemist

Turn any Reddit image into anything you can imagine by just mentioning `@bananas` (or `u/bananas`) with a plain‑English instruction. Fast. Serverless‑ready. Community‑friendly.

<br/>

<img alt="Bananas Banner" src="https://img.shields.io/badge/Reddit%20Bot-🍌%20Bananas-FFCC00?style=for-the-badge&logo=reddit&logoColor=white" />
<img alt="Python" src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img alt="PRAW" src="https://img.shields.io/badge/PRAW-Reddit%20API-FF4500?style=for-the-badge&logo=reddit&logoColor=white" />
<img alt="Gemini" src="https://img.shields.io/badge/Gemini-Image%20Editing-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img alt="License" src="https://img.shields.io/badge/License-Open%20Source-2ea44f?style=for-the-badge" />

<br/>

<i>“Say the word. The image obeys.”</i>

</div>

---

## ✨ What It Does

- Mention `@bananas` anywhere under an image post and add an instruction.
- The bot fetches the post’s image, applies your instruction with Gemini, and replies with a fresh PNG.
- Images are hosted for permanence via GitHub (or plug in another storage).

Examples:

```
"@bananas make it vaporwave"
"u/bananas remove the background"
"@bananas turn this into a watercolor painting"
```

---

## 🧭 Why This Repo Exists

- 24/7 bot experience without paying for always‑on servers
- Configurable rate limits and allowlists to keep things civil
- One‑click deploy path so others can run their own copy with their own key

---

## 🏗️ Architecture (at a glance)

```mermaid
flowchart LR
  A[Reddit Comment \n @bananas] --> B[Bananas Bot]
  B -->|Fetches| C[Post Image URL]
  B -->|Parses| D[Instruction]
  B -->|Calls| E[Gemini Image Edit]
  E -->|PNG| F[Upload: GitHub Contents API]
  F -->|URL| G[Reply on Reddit]
```

Optional serverless fit (recommended):

```mermaid
sequenceDiagram
  participant S as Cloud Scheduler (1m)
  participant R as Cloud Run/Function
  participant F as Firestore
  S->>R: HTTP Trigger
  R->>F: Load last checkpoint / cooldowns
  R->>R: Process N new mentions
  R->>F: Save checkpoint / cooldowns
```

---

## 🚀 Quick Start (Local)

1) Create `.env` in the project root:

```
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=bananas-bot/1.0 by YOUR_USERNAME
REDDIT_USERNAME=...
REDDIT_PASSWORD=...

SUBREDDITS=test
MAX_CALLS_PER_HOUR=10
USER_COOLDOWN_SECONDS=120
RATE_LIMIT_MODE=skip

GEMINI_API_KEY=...
GITHUB_TOKEN=...
GITHUB_REPO=YOUR_NAME/your-images-repo
GITHUB_BRANCH=main
```

2) Install deps and run:

```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

---

## 🛡️ Safety & Guardrails

- Per‑user cooldowns and an hourly global cap
- Optional allowlist (`ALLOWED_USERS`) to restrict who can trigger
- Hard size limits and content checks on downloads
- Errors are logged; the bot retries safely without flooding

---

## 🧩 Environment Variables

- `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`
- `SUBREDDITS` (e.g. `test+pics+funny`), `MAX_CALLS_PER_HOUR`, `USER_COOLDOWN_SECONDS`, `RATE_LIMIT_MODE`, `RATE_LIMIT_MESSAGE`
- `ALLOWED_USERS` (comma‑separated usernames; optional)
- `GEMINI_API_KEY`
- `GITHUB_TOKEN`, `GITHUB_REPO` (e.g. `owner/repo`), `GITHUB_BRANCH`

---

## ☁️ Deploy (Community‑Ready)

Add a “Deploy to Cloud Run” button to your fork for one‑click setups:

```
[![Deploy to Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/YOUR_NAME/YOUR_REPO)
```

Tip: Encourage users to deploy their own copy with their own `GEMINI_API_KEY` to distribute usage fairly.

---

## 🧪 Tips for Great Results

- Be explicit: “convert to watercolor” > “make it cool”
- Prefer a single, clear instruction
- If nothing is provided, the bot defaults to grayscale

---

## 🛠️ Roadmap

- Cloud Run/Functions + Scheduler polling mode
- Firestore for cooldowns/checkpoints
- Key health monitoring and dashboard
- Pluggable storage backends (GCS, R2, S3)

---

## 🤝 Contributing

Issues and PRs welcome. Please remove any secrets from logs and avoid sharing `.env` content in issues.

---

<div align="center">

Made with 🍌 — happy hacking!

</div>

