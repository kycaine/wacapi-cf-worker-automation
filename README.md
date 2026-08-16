# WhatsApp Admin Assistant Bot & Real-Time Dashboard 🚀

A production-grade, highly scalable WhatsApp automation suite deployed natively on the **Cloudflare Ecosystem**. 

This monorepo consists of a WhatsApp chatbot backend powered by Cloudflare Workers (Hono.js) and a real-time monitoring dashboard built with React (Vite) hosted on Cloudflare Pages.

---

## 🏗️ Architecture & Tech Stack

This project is built using a Monorepo structure, separated into two main applications:

### 1. Backend (`apps/worker`)
- **Runtime:** Cloudflare Workers (Edge Computing)
- **Framework:** [Hono.js](https://hono.dev/) (Ultra-fast web framework for the Edge)
- **Database:** Cloudflare D1 (Serverless SQLite) for storing chat logs, metrics, and contacts.
- **State/Cache:** Cloudflare KV for fast key-value lookups (e.g., rate-limiting, session states).
- **AI Integration:** Google Gemini API (`gemini-flash-lite-latest`) for smart, automated bot replies.
- **External API:** Meta WhatsApp Cloud API (Graph API v20.0+).

### 2. Frontend (`apps/pages`)
- **Framework:** React + TypeScript via Vite.
- **Hosting:** Cloudflare Pages.
- **Styling:** Tailwind CSS + Lucide Icons for a clean, modern, and mobile-first UI.
- **Visuals:** Recharts for rendering daily chat volume graphs.
- **Features:** 
  - **Overview:** Daily KPIs and Meta API limit progress bar.
  - **Chat History:** WhatsApp Web-style bubble chat interface.
  - **Statistics:** Inbound vs Outbound message charts.

---

## 📂 Project Structure

```text
wa-automation-cf-worker/
├── package.json              # Monorepo root / workspaces config
├── apps/
│   ├── worker/               # Backend (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts      # Main Hono router
│   │   │   ├── controllers/  # Webhook & API handlers
│   │   │   ├── middlewares/  # Basic Auth & error handlers
│   │   │   └── services/     # DB, WhatsApp, Gemini, Knowledge handlers
│   │   ├── schema.sql        # Cloudflare D1 Schema
│   │   └── wrangler.toml     # Cloudflare Worker configuration & bindings
│   │
│   └── pages/                # Frontend (Cloudflare Pages)
│       ├── src/
│       │   ├── App.tsx       # Routing (React Router)
│       │   ├── components/   # UI Components (MetricCards, Layout)
│       │   └── pages/        # Main Views (Overview, ChatHistory, Statistics, Login)
│       └── vite.config.ts    # Vite bundler config
```

---

## ⚙️ Prerequisites

Before you start, make sure you have:
1. [Node.js](https://nodejs.org/) (v18+)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally (`npm install -g wrangler`)
3. A Cloudflare Account.
4. A Meta Developer Account with a WhatsApp App set up.
5. Google Gemini API Key.

---

## 🚀 Setup & Installation

### 1. Install Dependencies
Run the following at the root of the project to install all dependencies for both apps:
```bash
npm install
```

### 2. Setup Cloudflare D1 Database
Create a new D1 database via Wrangler:
```bash
wrangler d1 create wa_automation_db
```
*Note down the `database_name` and `database_id` provided by the output and update `apps/worker/wrangler.toml`.*

Run the SQL migration to create tables:
```bash
cd apps/worker
wrangler d1 execute wa_automation_db --local --file=schema.sql
# For production:
# wrangler d1 execute wa_automation_db --remote --file=schema.sql
```

### 3. Configure Environment Variables
You need to set up environment variables for both the **Worker** and the **Pages** app.

**For Worker (`apps/worker/.dev.vars`):**
Create a `.dev.vars` file in `apps/worker/` based on the `.env.example`:
```env
WA_PHONE_NUMBER_ID="your_whatsapp_phone_number_id"
WA_ACCESS_TOKEN="your_whatsapp_access_token"
VERIFY_TOKEN="your_webhook_verify_token"
DASHBOARD_USERNAME="admin@example.com"
DASHBOARD_PASSWORD="secure_password"
ADMIN_NUMBERS="6281234567890"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-flash-lite-latest"
```

**For Pages (`apps/pages/.env`):**
Create an `.env` file in `apps/pages/` for local development:
```env
VITE_API_URL="http://localhost:8787"
VITE_DEFAULT_USERNAME="admin@example.com"
VITE_DEFAULT_PASSWORD="secure_password"
```

---

## 👨‍💻 Local Development

You can run both the frontend and backend concurrently.

**Start the Worker (Backend):**
```bash
cd apps/worker
npm run dev
```
*The API will be available at `http://localhost:8787`*

**Start the Pages (Frontend):**
```bash
cd apps/pages
npm run dev
```
*The Dashboard will be available at `http://localhost:5173`*

---

## 🚢 Deployment

### 1. Deploy the Backend (Worker)
Set up your production secrets first. Run the following commands and paste the respective values:
```bash
wrangler secret put WA_PHONE_NUMBER_ID
wrangler secret put WA_ACCESS_TOKEN
wrangler secret put VERIFY_TOKEN
wrangler secret put DASHBOARD_USERNAME
wrangler secret put DASHBOARD_PASSWORD
wrangler secret put ADMIN_NUMBERS
wrangler secret put GEMINI_API_KEY
wrangler secret put GEMINI_MODEL
```

Deploy to Cloudflare:
```bash
cd apps/worker
npm run deploy
```

### 2. Deploy the Frontend (Pages)
Before deploying, make sure to update `apps/pages/.env.production` with your live Worker URL:
```env
VITE_API_URL="https://wa-automation-worker.your-subdomain.workers.dev"
```

Build and deploy:
```bash
cd apps/pages
npm run build
npx wrangler pages deploy dist --project-name wa-automation-pages --branch main
```

---

## 🛡️ Security
- **Webhook Verification:** The bot only accepts incoming events from Meta after validating the `VERIFY_TOKEN`.
- **Admin Dashboard Auth:** The Worker backend exposes dashboard APIs protected by a Basic Auth layer based on the `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` environment variables.
- **Admin Command Restrictions:** Only WhatsApp numbers listed in `ADMIN_NUMBERS` can execute special administrative commands.

---

*Built for speed, scalability, and seamless integration on the Edge.* ☁️
