Act as a Principal Full-Stack Cloudflare Engineer.

I want to build a complete, production-grade **WhatsApp Admin Assistant Bot & Real-Time Monitoring Dashboard** deployed natively on the Cloudflare ecosystem.

Please generate a clean-code, scalable monorepo codebase containing two separate workspaces:
1. `apps/worker`: Backend API & Meta Webhook processor running on **Cloudflare Workers**.
2. `apps/pages`: Web Monitoring Dashboard deployed on **Cloudflare Pages**.

---

### 1. TECH STACK & ARCHITECTURE

#### A. Backend (`apps/worker`)
* **Runtime:** Cloudflare Workers (TypeScript)
* **Framework:** Hono.js (Edge-optimized routing)
* **Database & Persistence:** 
  - **Cloudflare D1 (SQLite):** To store incoming/outgoing chat logs, unique admin metrics, and execution latency.
  - **Cloudflare KV:** To store real-time daily usage counters, rate-limits, and session states.
* **External Integration:** Meta WhatsApp Cloud API (Graph API v20.0+).

#### B. Frontend (`apps/pages`)
* **Framework:** Vite + React (TypeScript) for a fast, client-side SPA. (Preferred over Next.js Static Export for pure Cloudflare Pages deployments).
* **Styling:** Tailwind CSS + Lucide Icons (Responsive, modern, clean dashboard UI, Mobile-First).
* **Data Fetching:** Fetch API / TanStack Query (React Query) connecting to Worker API endpoints.
* **Charts/Visuals:** Recharts or Chart.js (for daily chat volume, hourly breakdown, latency).

---

### 2. CORE FEATURES & MONITORING REQUIREMENTS

1. **WhatsApp Bot Capabilities:**
   - Meta Webhook verification (`GET`) and event processing (`POST`).
   - Admin whitelist verification (only configured numbers can execute commands).
   - Pre-built commands: `/help`, `/status`, `/stats` (fetches today's metrics directly in chat), `/ping`.
   - Asynchronous execution logging to Cloudflare D1 without delaying the WhatsApp response.

2. **Dashboard Features (`apps/pages`):**
   - **Daily Unique Numbers Tracker:** Visual progress bar against Meta Tier 0 Limit (250 unique numbers/day).
   - **Daily Message Counter:** Inbound vs. Outbound chats.
   - **Cloudflare Usage Overview:** Worker invocations count & D1 read/write approximations.
   - **Live Chat Logs:** Real-time searchable/filterable table displaying recent messages (Sender, Direction, Message Content, Command Triggered, Execution Latency, Timestamp).
   - **API Security:** Secure the dashboard monitoring endpoints with a bearer token or basic auth header (`API_SECRET`).
   - **Responsive UI:** Seamless layout on both mobile devices and desktop screens (Sidebar + Main View).

---

### 3. MONOREPO PROJECT STRUCTURE

Organize the repository cleanly as follows:

```text
wa-automation-suite/
├── package.json                   # Monorepo root / workspaces config
├── README.md
│
├── apps/
│   ├── worker/                    # Backend (Cloudflare Workers)
│   │   ├── wrangler.toml          # D1, KV bindings, and environment configs
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   ├── schema.sql             # Cloudflare D1 SQL table schemas (logs, metrics)
│   │   └── src/
│   │       ├── index.ts           # Hono entrypoint (routes for webhook & dashboard API)
│   │       ├── config/            # Env and secret bindings validator
│   │       ├── controllers/
│   │       │   ├── webhook.ts     # WhatsApp Meta webhook logic
│   │       │   └── stats.ts       # Metrics & logs API endpoints for Pages
│   │       ├── middlewares/
│   │       │   ├── auth.ts        # Admin whitelist & Dashboard token verification
│   │       │   └── errorHandler.ts
│   │       ├── services/
│   │       │   ├── dbService.ts   # D1 database operations & metrics aggregation
│   │       │   ├── whatsapp.ts    # Meta Graph API sender
│   │       │   └── command.ts     # Bot command handler (/help, /status, etc.)
│   │       └── types/             # Shared TypeScript schemas
│   │
│   └── pages/                     # Frontend (Cloudflare Pages)
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── components/
│           │   ├── Navbar.tsx
│           │   ├── MetricCard.tsx       # KPI counters (Daily limit, messages, latency)
│           │   ├── UsageProgressBar.tsx # Meta 250 limit visualizer
│           │   ├── AnalyticsChart.tsx   # Inbound/Outbound volume graph
│           │   └── LogsTable.tsx        # Responsive chat log table with filters
│           ├── services/
│           │   └── api.ts               # Worker API client
│           └── types/                   # Frontend interfaces
```



### 4. D1 DATABASE SCHEMA (schema.sql)
Please provide complete SQL schema definitions for:
- chat_logs: id, sender_number, direction (IN/OUT), message_text, command, status, latency_ms, created_at.
- daily_metrics: date, unique_senders_count, total_inbound, total_outbound.

```sql

CREATE TABLE IF NOT EXISTS chat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_number TEXT NOT NULL,
  direction TEXT NOT NULL,  -- 'IN' | 'OUT'
  message_text TEXT,
  command TEXT,
  status TEXT,               -- 'SUCCESS' | 'ERROR'
  latency_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_logs_sender ON chat_logs(sender_number);
CREATE INDEX IF NOT EXISTS idx_chat_logs_date ON chat_logs(created_at);

CREATE TABLE IF NOT EXISTS daily_metrics (
  date TEXT PRIMARY KEY,     -- 'YYYY-MM-DD'
  unique_senders_count INTEGER DEFAULT 0,
  total_inbound INTEGER DEFAULT 0,
  total_outbound INTEGER DEFAULT 0
);
```

### 5. CODE OUTPUT REQUIREMENTS
Provide copy-pasteable files for critical modules in both apps/worker and apps/pages.

Ensure TypeScript strictness and defensive error handling.

Provide step-by-step setup commands:
- Creating D1 database via wrangler d1 create & running migrations.
- Setting secrets (WA_ACCESS_TOKEN, WA_PHONE_NUMBER_ID, VERIFY_TOKEN, DASHBOARD_SECRET).
- Local development with Wrangler & Pages preview.
- Production deployment guidelines.