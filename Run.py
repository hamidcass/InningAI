from dotenv import load_dotenv
import os

load_dotenv()

#import all steps to our pipeline
from ingestion.ingest_stats import run_ingestion
from preprocessing.build_features import run_build_features
from training.train_models import train_all_models
from evalution.evaluate_models import run_eval

#define our s3 paths
RAW_DATA_URI = "s3://mlb-ml-data/raw/batting.parquet"
FEATURES_URI = "s3://mlb-ml-data/prepared/features.parquet"

MODELS_URI = "s3://mlb-ml-data/models"
MODEL_URIS = {
    "LinearRegression": "s3://mlb-ml-data/models/Linear_Regression.pkl",
    "Ridge": "s3://mlb-ml-data/models/Ridge.pkl",
    "RandomForest": "s3://mlb-ml-data/models/Random_Forest.pkl",
    "XGBoost": "s3://mlb-ml-data/models/XGBoost.pkl"
}

METRICS_URIS = {
    "LinearRegression": "s3://mlb-ml-data/models/metrics_LinearRegression.json",
    "Ridge": "s3://mlb-ml-data/models/metrics_Ridge.json",
    "RandomForest": "s3://mlb-ml-data/models/metrics_RandomForest.json",
    "XGBoost": "s3://mlb-ml-data/models/metrics_XGBoost.json"
}

IMPORTANCE_URIS = {
    "LinearRegression": "s3://mlb-ml-data/models/importance_LinearRegression.parquet",
    "Ridge": "s3://mlb-ml-data/models/importance_Ridge.parquet",
    "RandomForest": "s3://mlb-ml-data/models/importance_RandomForest.parquet",
    "XGBoost": "s3://mlb-ml-data/models/importance_XGBoost.parquet"
}

EVAL_OUTPUT_URI = "s3://mlb-ml-data/evaluation"

TARGET_STAT = "HR"



# #ingest raw data
# run_ingestion(
#     start_year=2020,
#     end_year=2025,
#     min_pa=200,
#     # output_uri="data/raw/batting.parquet",
#     output_uri=RAW_DATA_URI
# )

# #build features and save to s3
# print("Building features...")
# run_build_features(
#     target_stat=TARGET_STAT,
#     # input_uri="data/raw/batting.parquet",
#     # output_uri="data/processed/features.parquet"
#     input_uri=RAW_DATA_URI,
#     output_uri=FEATURES_URI
# )

print("Train models...")
train_results = train_all_models(
    input_uri=FEATURES_URI,
    target_stat=TARGET_STAT,
    model_uris=MODEL_URIS,
    metrics_uris=METRICS_URIS,
    importance_uris=IMPORTANCE_URIS
)

print("Evaluate models...")
eval_results = run_eval(
    models_uri=MODELS_URI,
    features_uri=FEATURES_URI,
    output_uri=EVAL_OUTPUT_URI,
    target_stat=TARGET_STAT
)

print("Pipeline complete.")
print("Evaluation Results:", eval_results)