# Admin Data Update Guide

There are **3 ways** to update pricing data in Funded Futures Network:

---

## Method 1: Using Admin Page + Update Script (Recommended)

**Best for:** Quick pricing updates, one-off changes

### Steps:

1. **Open admin page**: `https://otakgemuk.github.io/prop-firm-api/admin.html`
   - Password: `propfirm2026`

2. **Edit data**:
   - Click on a plan to edit
   - Change `eval_fee`, `activation_fee`, `active_discount_pct`, etc.
   - Click "Save" or use the inline editors

3. **Export JSON**:
   - Click **"📋 Export JSON"** button
   - JSON copies to clipboard
   - Save to your computer: `~/Downloads/plans.json`

4. **Update GitHub** (using the helper script):
   ```bash
   cd prop-firm-api
   ./admin-update.sh ~/Downloads/plans.json "Update Funded Futures Network pricing"
   ```

5. **Wait for deployment**:
   - GitHub Actions automatically builds and deploys
   - Site updates in **1-2 minutes**

---

## Method 2: Direct Data File Update (Manual)

**Best for:** Bulk updates, multiple firms

### Steps:

1. **Edit data file directly**:
   - Open `data/plans.json` in your editor
   - Update values for Funded Futures Network plans
   - Save file

2. **Sync to all locations**:
   ```bash
   cp data/plans.json frontend/data.json
   cp data/plans.json frontend/dist/plans.json
   cp data/plans.json frontend/public/plans.json
   ```

3. **Regenerate static data**:
   ```bash
   node -e "
     const data = require('./data/plans.json');
     const ts = '// Auto-generated\n\nexport const STATIC_PLANS = ' + JSON.stringify(data, null, 2) + ';\n';
     require('fs').writeFileSync('./frontend/src/lib/staticData.ts', ts);
   "
   ```

4. **Commit and push**:
   ```bash
   git add data/plans.json frontend/data.json frontend/src/lib/staticData.ts frontend/dist/plans.json
   git commit -m "data: Update Funded Futures Network pricing"
   git push origin main
   ```

5. **Wait for deployment** (1-2 minutes)

---

## Method 3: Via Scraper (Automated)

**Best for:** Keeping data in sync with live website

The scraper automatically runs **daily at 6 AM UTC** and:
- Fetches latest pricing from firm websites
- Updates SQLite database
- Exports to `data/plans.json`
- Auto-deploys to GitHub Pages

To trigger manually:
```bash
# This requires scraper dependencies and database setup
node scraper/index.js --firm funded_futures_n
```

---

## Funded Futures Network Pricing Reference

Current pricing structure (as of latest update):

| Account Size | Standard OG | Standard MAX | Express OG | Express MAX |
|---|---|---|---|---|
| 25K | $68 | $135 | ~$75 | ~$135 |
| 50K | $80 | $160 | ~$80 | ~$160 |
| 100K | $158 | $315 | ~$158 | ~$315 |
| 150K | $183 | $365 | ~$183 | ~$365 |
| 250K | $295 | $590 | ~$295 | ~$590 |

**Note**: All prices shown are **base prices** (before 50% discount).
Final prices = base × 0.5

Example:
- Standard MAX 50K base: $160
- With 50% discount: $80 (final price shown to users)

---

## Data Structure

Each plan object contains:

```json
{
  "firm_id": "funded_futures_n",
  "firm_name": "Funded Futures Network",
  "plan_label": "Standard MAX 50K",
  "account_size": 50000,
  "account_type": "Standard MAX",
  "eval_fee": 160.0,
  "activation_fee": 0.0,
  "monthly_fee": 0.0,
  "active_discount_pct": 50,
  "total_cost_to_funded": 80.0,
  // ... other fields
}
```

**Key fields**:
- `eval_fee`: Cost to start evaluation
- `activation_fee`: One-time activation cost
- `active_discount_pct`: Discount percentage (0-100)
- `total_cost_to_funded`: Final cost = (eval + activation) × (1 - discount/100)

---

## Troubleshooting

### Admin page shows old data
- Clear browser cache (Ctrl+Shift+R)
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

### Changes don't appear on live site
1. Check GitHub Actions status
2. Verify file was pushed to `main` branch
3. Wait 1-2 minutes for deployment to complete
4. Force refresh your browser

### Need to revert changes
```bash
git log --oneline  # Find previous commit
git revert <commit-hash>
git push origin main
```

---

## Git Workflow Reference

```bash
# View status
git status

# Stage all changes
git add -A

# Commit with message
git commit -m "fix: Update FFN pricing"

# Push to GitHub
git push origin main

# View commit history
git log --oneline -10
```

---

Need help? Check the admin page or create a GitHub issue.
