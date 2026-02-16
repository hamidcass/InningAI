# InningAI

**2025 MLB offensive projections** powered by machine learning. Compare predictions across multiple models (Linear Regression, Ridge, Random Forest, XGBoost) for stats like HR, AVG, OPS, and wRC+.

**Live app:** [inningai.dev](https://inningai.dev)  
**API:** [api.inningai.dev](https://api.inningai.dev)

---

## What it does

- **Predictions** — Browse and filter 2025 projections by stat and model; view tables and metrics.
- **Player search** — Look up a player, see predictions from all models, and compare to historical OPS.
- **Next season** — Explore projections with model comparison and feature importance.
- **Dataset** — Built from 9 years of qualified batting data (2016–2024), with park factors and sabermetric features.

---

## Tech stack

| Layer   | Stack |
|--------|--------|
| **Frontend** | React 19, TypeScript, Vite, React Router, Recharts, Bootstrap |
| **Backend**  | FastAPI, PostgreSQL, SQLAlchemy, pandas |
| **ML**       | scikit-learn, XGBoost, SHAP (feature importance) |
| **Data**     | [pybaseball](https://github.com/jldbc/pybaseball), S3 (raw/prepared data & models) |

---

## Project structure

```
InningAI/
├── frontend/          # React SPA (Vite)
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/
│   │   ├── pages/     # Home, Predictions, Search, NextSeason
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── api/           # FastAPI app (main.py)
│   ├── ingestion/     # Fetch batting data (pybaseball)
│   ├── preprocessing/ # Feature engineering, park factors
│   ├── training/      # Train models, save to S3/DB
│   ├── evalution/     # Evaluation pipeline
│   └── storage/       # S3 + DB helpers
├── amplify.yml        # AWS Amplify build (frontend)
├── requirements.txt   # Python deps
└── README.md
```

---

## Run locally

### Backend (API)

1. **Python env** (3.10+ recommended):

   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Environment** — Create a `.env` in the project root (or `backend/`) with your database and (optionally) AWS settings. Use placeholder values only in docs; never commit real credentials. (`.env` is gitignored.)

   Example variables the API expects:
   - `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_NAME` — for PostgreSQL (predictions).
   - AWS credentials — only needed if you want the API to load batting data from S3; otherwise it can use local data under `backend/data/raw/` or a fallback file.

   The API reads predictions from PostgreSQL. For batting data it tries S3 first (if configured), then local paths like `backend/data/raw/batting.parquet` or `backend/raw.csv`.

3. **Start API** (from repo root or `backend/api`):

   ```bash
   cd backend/api
   uvicorn main:app --reload --port 8000
   ```

   Docs: http://localhost:8000/docs

### Frontend

1. **Install and run** (from repo root):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Point at local API** — Edit `frontend/src/api/api.ts` and set `BASE_URL` to `http://localhost:8000` when developing. (Production uses `https://api.inningai.dev`.)

---

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health / welcome |
| `GET /predictions?stat=&model=&limit=` | Prediction table (e.g. stat=HR, model=XGBoost) |
| `GET /player/{name}` | All predictions for one player |
| `GET /players` | Unique players (for search dropdown) |
| `GET /player-history/{name}` | Historical OPS + 2025 prediction |
| `GET /stats` | Dataset stats (counts, years) |
| `GET /meta` | Available stats and models |
| `GET /metrics?stat=&model=` | Model metrics (MAE, R², etc.) |
| `GET /importance?stat=&model=` | Feature importance (e.g. SHAP) |

---

## Training pipeline (optional)

To re-ingest data, build features, train models, and write to S3 + DB, use the backend pipeline (requires AWS credentials and DB set up):

```bash
cd backend
python Run.py
```

- **Ingestion** — Fetches batting data via pybaseball (configurable year range, min PA), filters to multi-year players, writes raw data to S3 (and optionally local).
- **Preprocessing** — Builds features per target stat (HR, AVG, OPS, wRC+), adds park factors and “current”/“next” season columns.
- **Training** — Trains Linear Regression, Ridge, Random Forest, and XGBoost; saves models and metrics to S3; writes predictions into PostgreSQL.
- **Evaluation** — Runs evaluation and can upload results to S3.

S3 paths and target stats are configured in `backend/Run.py`. Use your own bucket and paths; ensure AWS credentials are set only in environment variables or a local `.env`, never committed.

---

## Deployment

- **Frontend** — AWS Amplify (build from `frontend/`, output `dist/`). Redirects: use **404-200** rewrite to `/index.html` for SPA routes (not a blanket 200 rewrite, or assets get HTML and the app breaks).
- **Backend** — Deployed separately (e.g. EC2, Lambda, or other host); CORS is configured for the frontend and custom domain.

---

## License

Private / unlicensed unless otherwise noted.
