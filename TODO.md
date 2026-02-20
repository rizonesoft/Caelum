# Glide — Project TODO

> **Glide** is an open-source Outlook & Teams plugin powered by Google Gemini 3 Pro.
> This checklist takes the project from an empty repo to production-ready distribution.

---

## Phase 0 — Environment & Tooling Setup

- [x] Install **Node.js LTS** (v20+) — [https://nodejs.org](https://nodejs.org)
- [x] Install **Git** and configure user name/email (`git config --global user.name / user.email`)
- [ ] Install **Visual Studio Code** with the following extensions:
  - [ ] ESLint
  - [ ] Prettier
  - [x] Office Add-ins Development Kit (Microsoft) — _replaces the old "Office Add-in Debugger"_
  - [x] Microsoft 365 Agents Toolkit (formerly Teams Toolkit)
- [x] Create a free **Google Cloud** account — [https://console.cloud.google.com](https://console.cloud.google.com)
- [x] Create a free **Microsoft 365 Developer** account — [https://developer.microsoft.com/en-us/microsoft-365/dev-program](https://developer.microsoft.com/en-us/microsoft-365/dev-program)
- [x] Install the **Yeoman** generator for Office Add-ins (`npm install -g yo generator-office`)
- [x] Verify toolchain versions (`node -v`, `npm -v`, `git --version`, `yo --version`)

---

## Phase 1 — Repository & Project Structure

### 1.1 GitHub Repository

- [x] Create a new public GitHub repo named **Glide** — [rizonesoft/Glide](https://github.com/rizonesoft/Glide)
- [x] Add a short description: _"AI-powered Outlook & Teams plugin using Google Gemini"_
- [x] Add topics/tags: `outlook-addin`, `teams-app`, `gemini-api`, `ai`, `open-source`
- [x] Choose the **MIT** license (or your preferred OSS license)
- [x] ~~Create a `develop` branch~~ — using `main` as the working branch (simpler for a new project)
- [x] Enable **GitHub Issues** and **Discussions**
- [x] Create issue labels: `outlook-plugin`, `teams-plugin`, `gemini-api`, `bug`, `enhancement`, `docs`, `good first issue`

### 1.2 Scaffold the Outlook Add-in

- [x] Run `yo office` and select:
  - Project type: **Office Add-in Task Pane**
  - Script type: **TypeScript**
  - Office app: **Outlook**
  - Project name: **Glide**
- [x] Verify the generated folder structure exists:
  ```
  Glide/
  ├── src/
  │   ├── taskpane/        # Task Pane HTML, CSS, TS
  │   └── commands/        # Function commands
  ├── manifest.xml         # Add-in manifest (production)
  ├── webpack.config.js
  ├── package.json
  └── tsconfig.json
  ```
- [x] Run `npm start` — verify the add-in sideloads in Outlook on the web

### 1.3 Project Hygiene Files

- [x] Create `.gitignore` (Node, dist, .env, OS files)
- [x] Create `.editorconfig` (indent size 2, UTF-8, LF line endings)
- [x] Create `.prettierrc` (singleQuote, trailingComma, printWidth: 100)
- [x] Create `.eslintrc.json` (extend recommended + typescript rules)
- [x] Create `CONTRIBUTING.md` (how to set up, code style, PR process)
- [x] Create `CODE_OF_CONDUCT.md` (Contributor Covenant)
- [x] Create `SECURITY.md` (vulnerability reporting instructions)
- [x] Create `CHANGELOG.md` (Keep a Changelog format)

---

## Phase 2 — Google Gemini API Integration

### 2.1 Google Cloud Setup

- [x] Create a Google Cloud project named **Glide**
- [x] Enable the **Generative Language API** (Gemini)
- [x] Generate an API key in the Google Cloud Console
- [x] Store the API key in a `.env` file (add `.env` to `.gitignore`)
- [x] Document the API key setup steps in `docs/setup-api-key.md`

### 2.2 Gemini Client Service

- [x] Install the Google Generative AI SDK: `npm install @google/generative-ai`
- [x] Create `src/services/gemini.ts`:
  - [x] Export a function `initGeminiClient(apiKey: string)` that creates a `GoogleGenerativeAI` instance
  - [x] Export a function `generateText(prompt: string, options?: GenerateOptions): Promise<string>`
  - [x] Add configurable parameters: `temperature`, `maxOutputTokens`, `topP`, `topK`
  - [x] Add error handling for API quota limits (+rate limiting with retry)
  - [x] Add error handling for network failures (timeout, offline)
  - [x] Add error handling for invalid/expired API keys
- [x] Create `src/services/gemini.test.ts` — unit tests with mocked API responses
- [x] Verify the service works by calling it from a simple test script

### 2.3 Prompt Engineering Module

- [x] Create `src/prompts/` directory
- [x] Create `src/prompts/templates.ts`:
  - [x] `DRAFT_EMAIL_PROMPT` — template for composing new emails from bullet points/instructions
  - [x] `REPLY_PROMPT` — template that includes original email context + desired tone
  - [x] `SUMMARIZE_THREAD_PROMPT` — template for summarizing multi-message threads
  - [x] `IMPROVE_WRITING_PROMPT` — template for grammar, clarity, tone adjustments
  - [x] `EXTRACT_ACTION_ITEMS_PROMPT` — template to pull tasks/deadlines from emails
  - [x] `TRANSLATE_PROMPT` — template for translating email content
  - [x] `CHANGE_TONE_PROMPT` — template for formal/casual/friendly/professional rewrites
- [x] Create `src/prompts/builder.ts`:
  - [x] Function `buildPrompt(template, variables)` — replaces placeholders in templates
  - [x] Function `truncateContext(text, maxTokens)` — safely truncates long emails
- [x] Write unit tests for prompt builder functions

---

## Phase 3 — Core Outlook Features

### 3.1 Read Current Email Context

- [x] Learn the `Office.js` mailbox API basics: `Office.context.mailbox.item`
- [x] Create `src/services/outlook.ts`:
  - [x] Function `getCurrentEmailBody(): Promise<string>` — reads the body of the open email
  - [x] Function `getCurrentEmailSubject(): Promise<string>` — reads the subject
  - [x] Function `getEmailSender(): Promise<{ name: string; email: string }>`
  - [x] Function `getEmailRecipients(): Promise<Array<{ name: string; email: string }>>`
  - [x] Function `getConversationMessages(): Promise<EmailMessage[]>` — reads thread (if available via EWS/Graph)
- [x] Handle both **Read** mode and **Compose** mode item types
- [x] Test each function with different email types (plain text, HTML, attachments)

### 3.2 Feature: Draft a New Email

- [x] Create `src/features/draft-email.ts`
- [x] Build a task pane form:
  - [x] Text area for user instructions/bullet points
  - [x] Dropdown for tone (formal, casual, friendly, professional)
  - [x] Dropdown for length (short, medium, detailed)
  - [x] "Generate Draft" button
- [x] On submit: call `generateText()` with `DRAFT_EMAIL_PROMPT`
- [x] Display the generated draft in a preview area
- [x] Add a "Copy to Compose" button that opens a new mail with the generated body
- [x] Add a "Regenerate" button to try again with the same inputs
- [x] Add a "Refine" text input to adjust the draft with follow-up instructions

### 3.3 Feature: Draft a Reply

- [x] Create `src/features/draft-reply.ts`
- [x] Auto-read the current email body and subject as context
- [x] Build a task pane form:
  - [x] Text area for reply instructions ("agree to the meeting", "decline politely")
  - [x] Dropdown for tone
  - [x] Checkbox: include original message in reply
- [x] On submit: call `generateText()` with `REPLY_PROMPT` + email context
- [x] Display the generated reply in a preview area
- [x] Add an "Insert into Reply" button that inserts text into the active compose window
- [x] Handle "Reply" vs "Reply All" scenarios

### 3.4 Feature: Summarize Email Thread

- [x] Create `src/features/summarize-thread.ts`
- [x] Read the full conversation/thread (use `getConversationMessages()`)
- [x] Build a task pane UI:
  - [x] "Summarize" button
  - [x] Radio buttons for summary style: bullet points, paragraph, TL;DR
  - [x] Slider or dropdown for summary length
- [x] On submit: call `generateText()` with `SUMMARIZE_THREAD_PROMPT`
- [x] Display summary in a scrollable read-only panel
- [x] Add a "Copy to Clipboard" button

### 3.5 Feature: Improve Writing

- [x] Create `src/features/improve-writing.ts`
- [x] Read selected text or full compose body
- [x] Build a task pane form:
  - [x] Radio buttons: Fix Grammar, Improve Clarity, Make Concise, Make Professional
  - [x] "Improve" button
- [x] Show a before/after diff view (highlight changes)
- [x] Add "Accept Changes" button to replace the original text

### 3.6 Feature: Extract Action Items

- [x] Create `src/features/extract-actions.ts`
- [x] Read the current email or thread
- [x] Call `generateText()` with `EXTRACT_ACTION_ITEMS_PROMPT`
- [x] Display a checklist of extracted tasks with owners and deadlines
- [x] Add a "Copy as Tasks" button (plain text list)
- [ ] (Future) Integration with Microsoft To Do / Outlook Tasks

### 3.7 Feature: Quick Translate

- [x] Create `src/features/translate.ts`
- [x] Read the current email body
- [x] Dropdown for target language
- [x] Call `generateText()` with `TRANSLATE_PROMPT`
- [x] Display translation side-by-side with original

---

## Phase 4 — UI / UX Design

### 4.1 Design System — Tailwind CSS v4

- [x] Install **Tailwind CSS v4.1** via PostCSS: `npm install -D tailwindcss @tailwindcss/postcss postcss postcss-loader`
- [x] Add PostCSS loader to `webpack.config.js` CSS rule
- [x] Create `src/styles/main.css` with `@import "tailwindcss"` and custom `@theme` tokens
- [x] Define custom design tokens via CSS-first `@theme` (colors, spacing, radii)
- [x] Support both **Light** and **Dark** theme (match Outlook's current theme via `prefers-color-scheme` + Office.js detection)
- [x] Migrate existing `taskpane.css` utility classes to Tailwind equivalents
- [x] Ensure all task pane components use Tailwind utility classes

### 4.2 Settings Page

- [x] Create `src/features/settings.ts`
- [x] API key input field (masked, with show/hide toggle)
- [x] Default tone preference
- [x] Default summary style preference
- [x] Default language for translations
- [x] Store settings in `localStorage` or `Office.context.roamingSettings`

---

## Phase 5 — Security & Configuration

### 5.1 API Key Management

- [x] **Never** ship the API key in the source code or manifest
- [ ] Implement secure storage for the API key:
  - [ ] Option A: Store in `Office.context.roamingSettings` (per-user, synced by Outlook)
  - [x] Option B: Prompt the user to enter their own key in the Settings page
- [x] Validate the API key format before storing
- [x] Add a "Test Connection" button in Settings to verify the key works

### 5.2 Privacy & Data Handling

- [ ] Create `PRIVACY.md` — document what data is sent to Google's API
- [ ] Display a first-run consent dialog explaining:
  - [ ] Email content is sent to Google Gemini for processing
  - [ ] No data is stored on any intermediate server
  - [ ] The user's API key is used directly
- [ ] Add a "Clear All Data" button in Settings (removes stored key + preferences)

### 5.3 Environment Configuration

- [ ] Create `src/config/environment.ts`:
  - [ ] `API_ENDPOINT` — Gemini API base URL
  - [ ] `MAX_TOKENS` — default max output tokens
  - [ ] `REQUEST_TIMEOUT` — API request timeout in ms
  - [ ] `RETRY_ATTEMPTS` — number of retries on failure
- [ ] Support `.env` for local dev and `process.env` for production

---

## Phase 6 — Testing

### 6.1 Unit Tests

- [ ] Set up **Jest** with TypeScript support (`ts-jest`)
- [ ] Configure Jest in `jest.config.ts`
- [ ] Write tests for:
  - [ ] `src/services/gemini.ts` — mock API, test error handling
  - [ ] `src/prompts/builder.ts` — template rendering, truncation
  - [ ] `src/services/outlook.ts` — mock Office.js API
  - [ ] Each feature module's core logic
- [ ] Add `npm test` script to `package.json`
- [ ] Aim for **>80% code coverage** on service and prompt modules

### 6.2 Integration Tests

- [ ] Test the full flow: read email → build prompt → call Gemini → display result
- [ ] Test with various email formats (plain text, HTML, long threads)
- [ ] Test with API errors (invalid key, rate limit, timeout)
- [ ] Test Settings persistence (save, reload, clear)

### 6.3 Manual Testing Checklist

- [ ] Sideload the add-in in Outlook on the Web
- [ ] Sideload the add-in in Outlook Desktop (Windows)
- [ ] Sideload the add-in in Outlook Desktop (Mac) — if available
- [ ] Test each feature with a real email
- [ ] Test with very long emails (10,000+ characters)
- [ ] Test with emails in different languages
- [ ] Test light and dark themes
- [ ] Test when offline (graceful error handling)

---

## Phase 7 — CI/CD & Automation

### 7.1 GitHub Actions — CI

- [ ] Create `.github/workflows/ci.yml`:
  - [ ] Trigger on `push` to `develop` and on all Pull Requests
  - [ ] Steps: checkout → install dependencies → lint → type-check → test → build
- [ ] Add a **status badge** to `README.md`
- [ ] Configure branch protection on `main`:
  - [ ] Require passing CI checks
  - [ ] Require at least 1 PR review

### 7.2 GitHub Actions — Release

- [ ] Create `.github/workflows/release.yml`:
  - [ ] Trigger on tags matching `v*.*.*`
  - [ ] Build the production bundle
  - [ ] Create a GitHub Release with the built artifact (zip)
  - [ ] Attach the `manifest.xml` to the release
- [ ] Document the release process in `docs/releasing.md`

### 7.3 Code Quality

- [ ] Add **Husky** for Git hooks: `npm install -D husky`
- [ ] Add a **pre-commit hook** that runs lint + format check
- [ ] Add a **commit-msg hook** for Conventional Commits format
- [ ] Add **lint-staged** to only lint changed files
- [ ] Configure **Dependabot** (`.github/dependabot.yml`) for weekly npm updates

---

## Phase 8 — Documentation

### 8.1 README.md

- [ ] Write a compelling project description
- [ ] Add a **Features** section with screenshots/GIFs
- [ ] Add a **Quick Start** section:
  - [ ] Prerequisites
  - [ ] Clone the repo
  - [ ] Install dependencies
  - [ ] Set up a Gemini API key
  - [ ] Sideload in Outlook
- [ ] Add a **Development** section (how to run, test, build)
- [ ] Add **Architecture** section with a simple diagram
- [ ] Add a **Contributing** link
- [ ] Add license and badge section

### 8.2 Developer Docs

- [ ] Create `docs/` directory
- [ ] `docs/architecture.md` — high-level architecture diagram and explanation
- [ ] `docs/setup-dev-environment.md` — step-by-step dev setup
- [ ] `docs/setup-api-key.md` — how to get and configure a Gemini API key
- [ ] `docs/adding-a-feature.md` — guide for contributors on adding new AI features
- [ ] `docs/prompt-engineering.md` — how prompts are structured and how to improve them
- [ ] `docs/testing.md` — how to run tests, what to test
- [ ] `docs/releasing.md` — how to create a release
- [ ] `docs/troubleshooting.md` — common issues and solutions

### 8.3 User Docs

- [ ] Create `docs/user-guide/` directory
- [ ] `docs/user-guide/installation.md` — how to install the add-in
- [ ] `docs/user-guide/getting-started.md` — first-time setup walkthrough
- [ ] `docs/user-guide/features.md` — how to use each feature with screenshots
- [ ] `docs/user-guide/faq.md` — frequently asked questions

---

## Phase 9 — Distribution & Publishing

### 9.1 Prepare for AppSource (Microsoft Store)

- [ ] Read the [AppSource submission guide](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/submit-to-appsource-via-partner-center)
- [ ] Create a **Microsoft Partner Center** account
- [ ] Validate the `manifest.xml` using the [Office Add-in Validator](https://github.com/OfficeDev/office-addin-manifest)
- [ ] Ensure the manifest has:
  - [ ] A unique add-in ID (GUID)
  - [ ] Correct permissions (minimum required)
  - [ ] Support URLs (privacy policy, terms of use, support page)
  - [ ] Icon assets in required sizes (16×16, 32×32, 64×64, 80×80, 128×128)
- [ ] Create icon assets and screenshots for the store listing
- [ ] Write the store listing description (short + long)
- [ ] Submit for Microsoft validation/review

### 9.2 Alternative Distribution (Sideloading / Centralized Deployment)

- [ ] Document how admins can deploy via **Microsoft 365 Admin Center** (Centralized Deployment)
- [ ] Document how individual users can sideload the add-in manually
- [ ] Provide a downloadable `manifest.xml` on the GitHub Releases page
- [ ] Create a simple landing page / GitHub Pages site for the project

### 9.3 Versioning & Releases

- [ ] Adopt **Semantic Versioning** (MAJOR.MINOR.PATCH)
- [ ] Tag the first stable release as `v1.0.0`
- [ ] Update `CHANGELOG.md` with each release
- [ ] Automate version bumping (`npm version patch/minor/major`)

---

## Phase 10 — Teams Plugin (Future)

> _Start this phase after the Outlook plugin is stable and published._

### 10.1 Setup

- [ ] Install **Teams Toolkit** for VS Code
- [ ] Scaffold a new Teams Message Extension or Tab app
- [ ] Set up a `glide-teams/` directory (or monorepo with shared packages)
- [ ] Share the Gemini service layer (`src/services/gemini.ts`) between both plugins

### 10.2 Features (Planned)

- [ ] Summarize a Teams chat/channel thread
- [ ] Draft a Teams message from bullet points
- [ ] Generate meeting notes from a chat thread
- [ ] Translate messages inline
- [ ] Quick reply suggestions in chat

### 10.3 Distribution

- [ ] Validate the Teams app manifest
- [ ] Submit to the **Teams App Store**
- [ ] Document the Teams-specific setup and deployment

---

## Phase 11 — Community & Maintenance

### 11.1 Community Building

- [ ] Add **"Good First Issue"** labels to beginner-friendly issues
- [ ] Create issue templates (bug report, feature request)
- [ ] Create a pull request template
- [ ] Set up GitHub Discussions for Q&A
- [ ] Write a "Welcome Contributors" post in Discussions
- [ ] Add a **Star History** badge to the README (optional)

### 11.2 Ongoing Maintenance

- [ ] Monitor Dependabot PRs and merge weekly
- [ ] Keep up with Gemini API updates and new model releases
- [ ] Keep up with Office.js API changes
- [ ] Respond to issues and PRs within 48 hours
- [ ] Write a monthly changelog / blog post (optional)
- [ ] Track usage/installs if published on AppSource

---

## Stretch Goals / Nice-to-Haves

- [ ] **Keyboard shortcuts** for common actions in the task pane
- [ ] **Context menu integration** — right-click selected text → "Improve with Glide"
- [ ] **Custom prompts** — let users save their own prompt templates
- [ ] **Usage analytics** — local-only stats (emails drafted, summaries generated)
- [ ] **Offline mode** — queue actions and process when back online
- [x] **Multi-model support** — allow switching between Gemini models (Pro, Flash)
- [ ] **Scheduled summaries** — auto-summarize unread emails at a set time
- [ ] **Attachment awareness** — summarize attached PDFs or documents
- [ ] **Calendar integration** — draft meeting agendas from calendar events
- [ ] **Voice input** — dictate instructions using Web Speech API

---

## Phase 12 — UI Polish & Improvements

> _Improvements identified from live testing and competitor analysis._

### 12.1 Button & Control Polish

- [x] Set all `.glide-btn` border-radius to 4px (`--radius-xs`)
- [ ] Make the "Refine" send button a perfect square (equal width/height, icon-only)
- [ ] Add subtle focus ring (`:focus-visible`) to all buttons for keyboard navigation
- [ ] Add press/active state (`:active`) — slight scale-down for tactile feedback
- [ ] Ensure button disabled state is clear (opacity + cursor not-allowed)
- [ ] Add loading spinner inside buttons when action is in progress (instead of overlay)
- [ ] Review all icon sizes for consistency (standardise to 15×15 or 16×16)

### 12.2 Form & Input Polish

- [ ] Add character counter on instruction textareas
- [ ] Auto-resize textareas as user types (auto-grow)
- [ ] Add clear/reset button (×) on text inputs
- [ ] Improve placeholder text — more contextual examples per feature
- [ ] Add subtle border animation on focus (not just colour change)

### 12.3 Layout & Spacing

- [ ] Review section padding consistency (p-lg everywhere)
- [ ] Add a subtle separator between form area and result preview
- [ ] Ensure result sections scroll independently (sticky action buttons)
- [ ] Add a "scroll to top" button when content is long
- [ ] Full-width mobile-friendly layout for Outlook desktop narrow pane

### 12.4 Typography & Colours

- [ ] Review font size hierarchy (xs=11, sm=12, md=13 feels tight — consider bumping)
- [ ] Add subtle text-shadow or letter-spacing to section headings
- [ ] Use colour coding for different action types (blue=compose, green=improve, purple=translate)
- [ ] Ensure dark mode colours have sufficient contrast (WCAG AA)

### 12.5 Animations & Transitions

- [ ] Add slide-in animation for result sections when they appear
- [ ] Add fade-out animation for loading overlay dismissal
- [ ] Add skeleton loading state while waiting for AI response
- [ ] Smooth scroll to result section after generation completes
- [ ] Add typing/streaming effect for AI-generated text (character-by-character reveal)

---

## Phase 13 — UX Enhancements

### 13.1 Reply & Draft Improvements

- [ ] Auto-detect reply context from subject line (RE:, FW:, etc.)
- [ ] Show estimated generation time based on email length
- [ ] Allow editing the generated text inline (contenteditable preview)
- [ ] Add "Copy to Clipboard" button alongside Reply/Reply All
- [ ] Remember last-used tone and instructions per email thread
- [ ] Add undo/redo for text insertions (prependAsync doesn't support undo natively)
- [ ] Word count & reading time on generated content

### 13.2 Smart Features (Competitor-Inspired)

- [ ] **Quick Reply Suggestions** — show 3 smart one-click reply options (Agree / Decline / Follow up)
- [ ] **Email Templates** — save & reuse common reply patterns
- [ ] **Tone Meter** — visual indicator showing the current tone (formal ↔ casual slider)
- [ ] **Recipient-Aware Drafting** — adjust tone based on whether recipient is internal/external
- [ ] **Follow-Up Reminders** — flag emails that need a follow-up after X days
- [ ] **Email Scoring** — rate the clarity/professionalism of your draft before sending
- [ ] **Thread Timeline** — visual timeline of a conversation showing key decisions
- [ ] **Smart CC Suggestions** — suggest who should be CC'd based on email content

### 13.3 Settings & Preferences

- [ ] Add "Test Connection" button for API key validation
- [ ] Add temperature/creativity slider in advanced settings
- [ ] Add max response length setting
- [ ] Add language preference for generated content
- [ ] Store settings in `Office.context.roamingSettings` for cross-device sync
- [ ] Export/import settings (backup & restore)
- [ ] Show current model capabilities (context window, speed) in model selector

---

## Phase 14 — Performance & Reliability

### 14.1 Speed Optimisations

- [ ] Implement response streaming (`generateContentStream`) for real-time text output
- [ ] Cache last-used email context to avoid re-reading on tab switch
- [ ] Debounce rapid button clicks (prevent double submissions)
- [ ] Lazy-load feature modules (only load Translate when tab is opened)
- [ ] Pre-warm the API connection on add-in start

### 14.2 Error Handling & Recovery

- [ ] Show specific, actionable error messages (not generic "Failed to generate")
- [ ] Add "Retry" button directly in error messages
- [ ] Save draft-in-progress to localStorage (recover after crash/reload)
- [ ] Handle token limit exceeded gracefully (auto-truncate and inform user)
- [ ] Add offline detection banner ("You're offline — features unavailable")

### 14.3 Logging & Debugging

- [ ] Add optional debug console in settings (toggle verbose logging)
- [ ] Log API response times for performance monitoring
- [ ] Add telemetry opt-in for anonymous usage stats

---

## Phase 15 — Accessibility (a11y)

- [ ] Add `aria-label` to all icon-only buttons
- [ ] Ensure all form controls have associated labels
- [ ] Add keyboard navigation for tab bar (arrow keys)
- [ ] Test with screen reader (Narrator, NVDA)
- [ ] Ensure colour contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] Add `role="alert"` to error and success messages
- [ ] Support `prefers-reduced-motion` — disable animations
- [ ] Add skip-to-content link for keyboard users

---

## Phase 16 — Production Readiness

### 16.1 Manifest & Icons

- [x] Add unique icons for each ribbon control (Open Panel, AI Tools, menu items)
- [x] Rename ribbon labels to avoid "AI Compose" × 3 confusion
- [x] Fix `.hidden` CSS class (Tailwind v4 wasn't generating it)
- [x] Add Gemini 3.1 Pro to model selector
- [ ] Create production manifest with actual domain URLs
- [ ] Validate manifest with office-addin-manifest tool
- [ ] Add high-resolution icons (128×128, 256×256) for store listing

### 16.2 Build & Deploy

- [ ] Add source maps stripping for production build
- [ ] Minify HTML output
- [ ] Add Content Security Policy (CSP) meta tag
- [ ] Configure webpack for tree-shaking unused features
- [ ] Add build version injection (show version in Settings footer)
- [ ] Set up staging deploy environment for testing before production

### 16.3 Security

- [ ] Encrypt stored API key in localStorage (AES with device fingerprint)
- [ ] Add CSP headers to prevent XSS
- [ ] Sanitize all AI-generated HTML before rendering (DOMPurify)
- [ ] Rate-limit client-side API calls (prevent abuse)
- [ ] First-run privacy consent dialog
- [ ] Create PRIVACY.md documenting data handling
