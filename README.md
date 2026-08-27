# CasaLens: House Price Prediction

CasaLens estimates house listing prices in India. The project has three parts:

- A Jupyter notebook that loads the Kaggle data, cleans it, trains the models, and evaluates them.
- A FastAPI backend that loads the trained pipeline and exposes prediction endpoints.
- A React and Vite frontend where a user enters the property details.

## Project structure

```text
House_Price_Project/
├── notebooks/
│   ├── house_price_model.ipynb
│   └── data/house_prices.csv
├── models/
│   ├── house_price.pkl
│   └── locations.json
├── backend/
│   ├── app/
│   ├── models/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md

## Requirements

- Python 3.13
- pandas, NumPy, scikit-learn 1.9.0, and joblib
- FastAPI, Uvicorn, Pydantic Settings, and httpx2
- pytest and pytest-cov
- Node.js with npm
- React 19, TypeScript, Vite 8, and React Router

## Dataset

The notebook uses [House Price by Juhi Bhojani](https://www.kaggle.com/datasets/juhibhojani/house-price) from Kaggle. Download the dataset and place `house_prices.csv` at `notebooks/data/house_prices.csv`.

The raw CSV is not included in the repository because it is large.

## Backend setup

From the project root, create the environment and install the backend packages:

```powershell
py -3.13 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

The backend expects these files in `backend/models/`:

```powershell
Copy-Item models\house_price.pkl backend\models\house_price.pkl
Copy-Item models\locations.json backend\models\locations.json
Copy-Item backend\.env.example backend\.env
```

Start the API from the `backend` directory:

```powershell
Set-Location backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend loads the model once at startup. Its environment variables are:

| Variable | Default | Purpose |
|---|---|---|
| `MODEL_PATH` | `models/house_price.pkl` | Path to the trained pipeline |
| `LOCATIONS_PATH` | `models/locations.json` | Location list for the API |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |

## Frontend setup

In a second terminal:

```powershell
Set-Location frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:5173` in a browser. The frontend uses `VITE_API_BASE_URL` as the backend origin. For local development, it should be `http://localhost:8000` without a trailing slash.

To create the production frontend bundle:

```powershell
npm run build
```

## API

The API runs at `http://127.0.0.1:8000` by default.

### `GET /health`

Returns:

```json
{"status": "ok"}
```

### `GET /locations`

Returns the grouped locations used by the form. Example (shortened):

```json
{"locations": ["agra", "ahmedabad", "aurangabad"]}
```

### `POST /predict`

Request body:

```json
{
  "location": "mumbai",
  "carpet_area_sqft": 1200,
  "floor_num": 3,
  "bathroom": 2,
  "balcony": 1,
  "furnishing": "Semi-Furnished",
  "transaction": "Resale",
  "ownership": "Freehold",
  "facing": "East"
}
```

Example response:

```json
{"predicted_price": 11713155.78}
```

The API validates the numeric fields and maps an unknown location to `other` before prediction.

## Testing

Run backend commands from `backend/`:

```powershell
python -m pytest -v
python -m pytest --cov=app --cov-report=term-missing -v
```

Run frontend commands from `frontend/`:

```powershell
npm test
npm run lint
npm run build
```

The current verified results are 26 passing backend tests with 100% backend coverage, 22 passing frontend tests, a passing lint check, and a passing production build.

## ML model

The selected model is a `RandomForestRegressor` trained through a `TransformedTargetRegressor` with a log-transformed target. The exported pipeline is stored at `models/house_price.pkl`, and the notebook contains the cleaning, training, and evaluation work.

The model uses these input features:

```text
carpet_area_sqft, floor_num, bathroom, balcony,
location_grouped, Furnishing, Transaction, Ownership, facing
```

The backend copy of the model is `backend/models/house_price.pkl`.


## Limitations

- The prediction is a model estimate, not an appraisal or a guaranteed sale price.
- The model was trained on historical Indian listings, so results can vary by location and property type.
- Notebook reruns need a separately downloaded raw CSV.
- The exported model depends on scikit-learn 1.9.0.
