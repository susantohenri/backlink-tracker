# 🚀 Backlink Tracker & Automation

A modern application to track, manage, and automate backlink submissions for Android applications across various search engines and directories.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Database / Storage**: Firebase Firestore (with built-in In-Memory Mock Mode for offline development)
- **Automation Engine**: Node.js v24 HTTP server, Playwright (Chromium)

---

## 📋 Prerequisites

Before getting started, make sure you have:
- **Node.js**: v20+ or v24+ (Node v24 is recommended for native TypeScript execution)
- **npm**: v10+
- **Git**

---

## ⚡ Step-by-Step Setup Guide

### 1. Clone the Repository & Install Dependencies

```bash
git clone <repository-url>
cd backlink-tracker
npm install
```

### 2. Install Playwright Chromium Browser

The automation engine uses Playwright Chromium to fill and submit forms on target websites:

```bash
npx playwright install chromium
```

---

### 3. Setup Environment Variables (`.env`)

Copy the `.env.example` file to create your `.env`:

```bash
# Windows PowerShell
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and adjust the configuration:

```env
# ==========================================
# 1. FRONTEND: Firebase Configuration
# ==========================================
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Set to true if you want to run offline without a Firebase connection (uses in-memory storage)
VITE_USE_MOCK=false

# ==========================================
# 2. AUTOMATION: Server & Credentials
# ==========================================
# URL of local automation server (used by React UI)
VITE_AUTOMATION_SERVER_URL=http://localhost:3001

# Port for the local automation server
AUTOMATION_PORT=3001

# Credentials used by automation runners:
DEFAULT_SUBMISSION_EMAIL=your_email@example.com
DEFAULT_SUBMISSION_PASSWORD=your_secure_password
```

> [!TIP]
> **Testing Without Firebase?**
> Set `VITE_USE_MOCK=true` or append `?mock=true` to your browser URL to use the in-memory mock storage mode without configuring Firebase credentials.

---

## 🏃 Running the Application

To use the full feature set (including website automation), you will run two processes:

### Terminal 1: Start the React Frontend
```bash
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

### Terminal 2: Start the Automation Server
```bash
# Standard mode (runs in background / headless)
npm run automation

# OR Visual Debug Mode (opens visible Chrome browser on your desktop)
npm run automation:headed
```
The server will start listening at `http://localhost:3001`.

---

## 🤖 Website Submission Automation

### How it Works:
1. Open the **Submissions** tab and click **Create Submission** (or launch from **What to do now** recommendations).
2. Select an **Android App** and a **Target Website**.
3. **Smart Detection**: If the selected website is supported for automation (currently: **Active Search Results**), the **[Run Automation]** button will appear automatically on the form.
4. Click **[Run Automation]**:
   - The React UI sends a request to the local automation server (`http://localhost:3001/run-submission`).
   - Playwright launches Chromium, navigates to the target site, and fills in the required data (URL prioritized from `landingPageUrl || playStoreUrl`, and email from server configuration).
   - The form is submitted and the response is verified.
5. **Outcome**:
   - **SUCCESS**: The submission is automatically saved to Firestore as `APPROVED`, with today's date and the post URL (if detected). The form transitions to edit mode seamlessly without closing.
   - **MANUAL_REQUIRED**: Displays actionable feedback (e.g. CAPTCHA, anti-bot challenge, or missing credentials) so you can proceed manually.
   - **FAILED**: Displays the error reason directly inside the form.

### Debugging & Troubleshooting Automations:
If an automation fails or you want to see the browser fill in the form step-by-step:
1. Stop the automation server in Terminal 2.
2. Restart it with headed mode:
   ```bash
   npm run automation:headed
   ```
3. Click **[Run Automation]** again in the UI. A Chromium browser window will open on your desktop, allowing you to watch the navigation and submission live.

---

## 📜 Available NPM Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite React development server |
| `npm run build` | Typechecks and builds the production frontend |
| `npm run automation` | Starts the local Playwright automation server |
| `npm run automation:headed` | Starts the automation server with visible browser GUI |
| `npm run lint` | Runs ESLint |
| `npm run test:e2e` | Runs Playwright end-to-end tests |
