from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text
import os

from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="MLB Prediction API")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

@app.get("/")
def root():
    return {"message": "MLB Prediction API is running."}

@app.get("/predictions")
def get_predictions(stat: str, model: str, limit: int = 20):
    
    """
        Retrieve the latest predictions for a specified model
        Ex: /predictions?stat=HR&model=XGBoost
    """

    table_name = f"{stat.lower()}_{model.lower()}_predictions"

    q = text(f"""
        SELECT * 
        FROM {table_name}
        ORDER BY "Player"
        LIMIT :limit
             """)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(q, {"limit": limit})
            rows = [dict(row._mapping) for row in result]
        return {
            "stat": stat,
            "model": model,
            "count": len(rows),
            "predictions": rows
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@app.get("/player/{player_name}")
def get_player_prediction(player_name: str):
    """
        Retrieve all predictions for a specified player across all models
        Ex: /player/Mike Trout
    """

    stats = ["hr", "avg", "ops", "wrc_plus"]
    # stat_changed = stat.lower().replace("+", "plus")
    models = ["linearregression", "ridge", "randomforest", "xgboost"]

    results = []

  
    try:
        with engine.connect() as conn:
            for stat in stats:
                for model in models:
                    table_name = f'"{stat}_{model}_predictions"'
                    q = text(f"""
                        SELECT *, :stat AS stat, :model AS model 
                        FROM {table_name}
                        WHERE "Player" ILIKE :player
                        ORDER BY "Next_Season" DESC
                        LIMIT 1
                             """)
                    result = conn.execute(q, {
                        "player": f"%{player_name}%",
                        "stat": stat.upper(),
                        "model": model
                    })
                    row = result.fetchone()
                    if row:
                        results.append(dict(row._mapping))
        if not results:
            raise HTTPException(status_code=404, detail="Player not found")
        
        return {
            "player": player_name,
            "count": len(results),
            "predictions": results
        }
    

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@app.get("/meta")
def get_metadata():

    stats = ["hr", "avg", "ops", "wrc_plus"]
    models = ["LinearRegression", "Ridge", "RandomForest", "XGBoost"]

    combos = [
        {"stat": s, "model": m}
        for s in stats
        for m in models
    ]

    return {"available_predictions": combos}