# Prop Firm Compare

A comparison engine for futures prop firms. Built with React, Tailwind, and TanStack Table.

**Live site:** https://otakgemuk.github.io/prop-firm-api/

## How It Works

All plan data lives in a single file: **`data/plans.json`**

The frontend loads this JSON at startup and handles all filtering, sorting, and pagination client-side. No backend required — it's a fully static site hosted on GitHub Pages.

### Updating Data

1. Edit `data/plans.json` (directly on GitHub or locally)
2. Commit and push to `main`
3. GitHub Actions automatically rebuilds and deploys (~2 minutes)

That's it. No database, no server, no API.

### Data Schema

Each entry in `data/plans.json`:

| Field                | Type    | Example             | Description                          |
|----------------------|---------|---------------------|--------------------------------------|
| `firm_id`            | string  | `"f01"`             | Unique firm identifier               |
| `firm_name`          | string  | `"Topstep"`         | Display name                         |
| `firm_slug`          | string  | `"topstep"`         | URL-friendly slug                    |
| `logo_url`           | string? | `null`              | Firm logo URL (null = show initial)  |
| `website_url`        | string  | `"https://..."`     | Firm website (Buy Now link)          |
| `trustpilot`         | number  | `4.3`               | Trustpilot rating                    |
| `plan_id`            | string  | `"p01"`             | Unique plan identifier               |
| `account_size`       | number  | `50000`             | Account size in USD                  |
| `plan_label`         | string  | `"50K"`             | Display label for account size       |
| `drawdown_type`      | string  | `"end_of_day"`      | `end_of_day` / `trailing` / `static` / `intraday` |
| `drawdown_amount`    | number  | `2000`              | Max drawdown in USD                  |
| `daily_loss_limit`   | number  | `1000`              | Daily loss limit in USD              |
| `profit_target`      | number  | `3000`              | Profit target in USD                 |
| `profit_split`       | number  | `80`                | Trader's profit split %              |
| `eval_fee`           | number  | `149`               | Evaluation fee in USD                |
| `activation_fee`     | number  | `0`                 | Activation fee in USD                |
| `monthly_fee`        | number  | `0`                 | Monthly recurring fee in USD         |
| `is_one_time`        | number  | `0`                 | 1 = one-time payment, 0 = recurring |
| `payout_frequency`   | string  | `"biweekly"`        | `weekly` / `biweekly`                |
| `first_payout_days`  | number? | `null`              | Days until first payout              |
| `total_cost_to_funded` | number | `134.1`            | Computed total cost (eval + activation - discount) |
| `active_discount_pct` | number | `10`               | Active discount % (0 = none)         |

### Adding a New Firm

Add entries to `data/plans.json` with a new `firm_id` (e.g., `"f11"`) and unique `plan_id`s.

### Adding a New Plan

Add a new object to the array with a unique `plan_id` and the existing `firm_id`.

### Removing a Firm

Delete all plan entries with that `firm_id`.

## Architecture

```
prop-firm-api/
├── data/
│   ├── plans.json           ← Single source of truth
│   ├── firms.json
│   └── discounts.json
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ComparisonCard.tsx
│       │   ├── FilterBar.tsx
│       │   ├── PlanTable.tsx
│       │   └── ErrorBoundary.tsx
│       ├── hooks/
│       │   └── usePlans.ts  ← Loads plans.json, client-side filtering
│       ├── App.tsx
│       ├── Admin.tsx
│       └── main.tsx
└── .github/workflows/
    └── deploy.yml            ← Auto-build & deploy on push to main
```

## Local Development

```bash
cd frontend
npm install
npm run dev        # opens http://localhost:5173
```

## Build

```bash
cd frontend
npm run build      # outputs to frontend/dist/
```

The build copies `data/plans.json` into `dist/plans.json` automatically.
