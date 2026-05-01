# Prop Firm Compare

A full-stack comparison engine for futures prop firms. Built with Node.js/Express/PostgreSQL on the backend and React/Tailwind/TanStack Table on the frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Sidebar │  │usePlans()│  │  PlanTable / Cards     │ │
│  │ Filters │→ │  Hook    │→ │  (TanStack Table v8)   │ │
│  └─────────┘  └────┬─────┘  └────────────────────────┘ │
│                    │ GET /api/plans?accountSizeMin=…    │
├────────────────────┼────────────────────────────────────┤
│  Backend (Express) │                                    │
│                    ▼                                    │
│  ┌──────────────────────────┐                           │
│  │ GET /api/plans           │                           │
│  │  • Dynamic WHERE clauses │                           │
│  │  • Total Cost calc       │                           │
│  │  • Discount code logic   │                           │
│  │  • Pagination            │                           │
│  └────────────┬─────────────┘                           │
│               ▼                                         │
│  ┌──────────────────────────┐                           │
│  │ PostgreSQL               │                           │
│  │  firms, plans, platforms,│                           │
│  │  discount_codes          │                           │
│  └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Database

```bash
# Create the database
createdb propfirm

# Run the migration
psql propfirm < backend/migrations/001_schema.sql

# Seed with sample data
cd backend && cp .env.example .env  # edit DATABASE_URL
npm install
npm run seed
```

### 2. Backend

```bash
cd backend
npm install
npm run dev    # starts on :3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev    # starts on :5173, proxies /api → :3001
```

Open http://localhost:5173

## API: GET /api/plans

All query parameters are optional:

| Param            | Type     | Example                    | Description                      |
|------------------|----------|----------------------------|----------------------------------|
| `accountSizeMin` | number   | `50000`                    | Minimum account size (slider)    |
| `accountSizeMax` | number   | `200000`                   | Maximum account size (slider)    |
| `drawdownType`   | string   | `trailing,static`          | Comma-separated filter           |
| `platform`       | string   | `NinjaTrader`              | Exact platform name              |
| `firm`           | string   | `topstep`                  | Firm slug                        |
| `search`         | string   | `apex`                     | Global text search               |
| `sort`           | string   | `total_cost`               | Sort column (see whitelist)      |
| `order`          | string   | `asc` / `desc`             | Sort direction                   |
| `page`           | number   | `1`                        | Page number                      |
| `limit`          | number   | `50`                       | Rows per page (max 200)          |

### Response

```json
{
  "data": [
    {
      "firm_id": "...",
      "firm_name": "Apex Trader Funding",
      "firm_slug": "apex-trader-funding",
      "logo_url": null,
      "website_url": "https://apextraderfunding.com",
      "trustpilot": 4.5,
      "plan_id": "...",
      "account_size": 50000,
      "plan_label": "50K",
      "drawdown_type": "end_of_day",
      "drawdown_amount": 2500,
      "daily_loss_limit": 1250,
      "profit_target": 3000,
      "profit_split": 100,
      "eval_fee": 167,
      "activation_fee": 0,
      "monthly_fee": 0,
      "is_one_time": true,
      "payout_frequency": "biweekly",
      "total_cost_to_funded": 133.60,
      "active_discount_pct": 20
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 35,
    "pages": 1
  }
}
```

## Key Concepts

### Total Cost to Funded

Calculated server-side in SQL:

```sql
total_cost = eval_fee + activation_fee - (eval_fee × best_active_discount% / 100)
```

The best active discount per firm is selected using `DISTINCT ON` with validity date filtering.

### Frontend → Backend State Flow

1. User adjusts a filter in `Sidebar` (e.g., moves the account size slider)
2. Sidebar fires `onAccountSizeChange(min, max)` callback
3. `App` updates its state: `setAccountSizeMin(min)` / `setAccountSizeMax(max)`
4. The `filters` object changes → `usePlans` hook detects the change via `useCallback` deps
5. Hook builds query string: `GET /api/plans?accountSizeMin=50000&accountSizeMax=150000`
6. Express route parses params → builds dynamic `WHERE` clauses → queries PostgreSQL
7. Response flows back → `data` state updates → `PlanTable` re-renders

### Server-Side vs Client-Side Sorting

- **Sorting**: TanStack Table handles visual sort indicators and click handlers, but the actual sorting is done by PostgreSQL (`ORDER BY`). When the user clicks a column header, the sort state propagates up to `App`, which passes `sort` and `order` params to the API.
- **Filtering**: All filtering is server-side (SQL `WHERE` clauses). The frontend just sends the filter values.
- **Pagination**: Server-side. The API returns `pagination.total` and `pagination.pages` for the UI controls.

## Project Structure

```
propfirm-compare/
├── backend/
│   ├── migrations/
│   │   └── 001_schema.sql          # PostgreSQL DDL
│   └── src/
│       ├── routes/
│       │   └── plans.js             # GET /api/plans with filters
│       ├── utils/
│       │   ├── db.js                # pg.Pool connection wrapper
│       │   └── seed.js              # Sample data seeder
│       └── server.js                # Express entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ComparisonCard.tsx    # Card view component
│       │   ├── PlanTable.tsx         # TanStack Table engine
│       │   └── Sidebar.tsx           # Filter sidebar
│       ├── hooks/
│       │   └── usePlans.ts           # API fetch hook
│       ├── lib/
│       │   └── api.ts                # Shared fetch helpers
│       ├── App.tsx                   # Main page (state owner)
│       ├── main.tsx                  # React entry point
│       └── index.css                 # Tailwind imports
└── README.md
```
