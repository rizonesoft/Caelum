<p align="center">
  <img src="assets/icon-128.png" alt="Glide Logo" width="80" />
</p>

<h1 align="center">Glide</h1>
<p align="center">
  <strong>AI-Powered Email Assistant for Microsoft Outlook</strong>
</p>
<p align="center">
  <a href="https://github.com/rizonesoft/Glide/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
  <a href="https://github.com/rizonesoft/Glide/actions/workflows/deploy-dev.yml"><img alt="Deploy Dev" src="https://github.com/rizonesoft/Glide/actions/workflows/deploy-dev.yml/badge.svg"></a>
  <a href="https://github.com/rizonesoft/Glide/actions/workflows/deploy-prod.yml"><img alt="Deploy Production" src="https://github.com/rizonesoft/Glide/actions/workflows/deploy-prod.yml/badge.svg"></a>
</p>

---

Glide is an open-source Outlook add-in that brings the power of **Google Gemini AI** directly into your inbox. Draft emails, generate replies, summarize threads, improve writing, extract action items, and translate — all without leaving Outlook.

## ✨ Features

| Feature                | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| **📝 Draft Email**     | Generate professional emails from a brief description and desired tone |
| **↩️ Reply**           | Craft context-aware replies based on the original email thread         |
| **📋 Summarize**       | Condense long email threads into bullet points, paragraphs, or TL;DR   |
| **✍️ Improve Writing** | Polish grammar, tone, clarity, and professionalism of any text         |
| **✅ Extract Actions** | Pull out action items, deadlines, and tasks from emails                |
| **🌐 Translate**       | Translate email content into 20+ languages                             |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available)
- Microsoft Outlook (desktop, web, or Microsoft 365)

### Installation

**Option A — Install from GitHub Pages (recommended)**

1. Download the production manifest:
   **[manifest.xml](https://rizonesoft.github.io/Glide/manifest.xml)**
2. Open **Outlook on the web** → click **Get Add-ins** (or **Manage Add-ins**)
3. Go to **My add-ins** → **Add a custom add-in** → **Add from file**
4. Upload the downloaded `manifest.xml`
5. Open any email → click the **Glide** button in the ribbon
6. Enter your Gemini API key in **Settings** (gear icon)

**Option B — Install the Dev/Nightly build**

For early access to the latest features:

1. Download the dev manifest:
   **[manifest.xml](https://rizonesoft.github.io/Glide/dev/manifest.xml)**
2. Follow the same sideloading steps as Option A
3. The dev build appears as **"Glide (Dev)"** in Outlook so it won't conflict with the production version

**Option C — Organization-wide deployment (M365 Admin)**

1. Go to [admin.microsoft.com](https://admin.microsoft.com) → **Settings** → **Integrated Apps**
2. Click **Upload custom apps** → **Provide link to manifest file**
3. Enter: `https://rizonesoft.github.io/Glide/manifest.xml`
4. Assign to users or groups → **Deploy**

> **Note:** Updates are automatic — when we deploy new code to GitHub Pages, the add-in updates for all users on the next load. No reinstallation needed.

## 🛠️ Development

### Setup

```bash
# Clone the repository
git clone https://github.com/rizonesoft/Glide.git
cd Glide

# Install dependencies
npm install

# Create a .env file with your Gemini API key
echo "GEMINI_API_KEY=your-key-here" > .env

# Start the development server
npm run dev-server
```

### Sideload for Development

1. Start the dev server (`npm run dev-server`) — runs on `https://localhost:3000`
2. Open Outlook on the web
3. **Get Add-ins** → **My add-ins** → **Add a custom add-in** → **Add from file**
4. Upload `manifest.xml` from the project root
5. The add-in will hot-reload as you make changes

### Build

```bash
# Production build (outputs to dist/)
npm run build

# Run linting
npm run lint
```

### Project Structure

```
Glide/
├── src/
│   ├── features/          # Feature modules (draft, reply, summarize, etc.)
│   ├── services/          # Gemini API client, Outlook service
│   ├── prompts/           # Prompt templates and builder
│   ├── taskpane/          # Main UI (HTML, TypeScript, CSS)
│   └── commands/          # Outlook ribbon command handlers
├── assets/
│   └── icons/             # Lucide SVG icons
├── manifest.xml           # Local development manifest (localhost)
├── manifest.dev.xml       # Dev/Nightly manifest (GitHub Pages /dev/)
├── manifest.prod.xml      # Production manifest (GitHub Pages root)
└── .github/workflows/     # CI/CD deployment workflows
```

## 🔄 Deployment

Glide uses a **dual-environment** deployment strategy on GitHub Pages:

| Environment    | URL                                                                        | Trigger                          | Manifest                                                               |
| -------------- | -------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| **Dev**        | [rizonesoft.github.io/Glide/dev/](https://rizonesoft.github.io/Glide/dev/) | Auto on every push to `main`     | [Dev manifest](https://rizonesoft.github.io/Glide/dev/manifest.xml)    |
| **Production** | [rizonesoft.github.io/Glide/](https://rizonesoft.github.io/Glide/)         | Manual trigger in GitHub Actions | [Production manifest](https://rizonesoft.github.io/Glide/manifest.xml) |

### Promoting Dev to Production

1. Test the dev build by sideloading the dev manifest
2. When satisfied, go to **[GitHub Actions](https://github.com/rizonesoft/Glide/actions)** → **Deploy Production** → **Run workflow**
3. Production users will receive the update automatically on their next add-in load

## ⚙️ Settings

Access settings via the **gear icon** in the add-in:

- **API Key** — Your Google Gemini API key (stored locally in your browser)
- **Model** — Choose between Gemini 3 Flash/Pro (latest) or Gemini 2.5 Flash/Pro (stable)
- **Default Tone** — Set the default writing tone (Professional, Formal, Friendly, Casual)
- **Summary Style** — Default format for summaries (Bullets, Paragraph, TL;DR)
- **Language** — Default translation target language

## 🔒 Privacy

- Your **API key** is stored locally in your browser's `localStorage` — it never leaves your device
- Email content is sent directly to the **Google Gemini API** for processing
- **No data** is stored on our servers — Glide is entirely client-side
- The add-in only requests **ReadWriteItem** permissions (the minimum needed)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://rizonesoft.com">Rizonesoft</a>
</p>
