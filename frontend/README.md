# CasaLens frontend

React + TypeScript + Vite UI for the CasaLens house-price predictor.

## Scripts

```bash
copy .env.example .env
npm install
npm run dev      # http://127.0.0.1:5173
npm run build
npm run lint
```

`VITE_API_BASE_URL` must point at the FastAPI origin (default `http://localhost:8000`). The UI never hard-codes that URL in components.

## Routes

| Path | Page |
|---|---|
| `/` | Home, hero, prediction form |
| `/result` | Formatted estimate (from router state) |
| `*` | Not found |

The form loads locations from `GET /locations`, checks `GET /health`, and submits `POST /predict`.
