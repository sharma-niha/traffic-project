from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import random
from datetime import datetime
from ml_model import TrafficPredictor
from traffic_simulator import generate_traffic_data

app = FastAPI(title="TrafficAI API")

# Allow React dashboard to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML model
predictor = TrafficPredictor()

intersections = [
    {"id": 1, "name": "NH-8 / Ring Road"},
    {"id": 2, "name": "Sector-5 Crossing"},
    {"id": 3, "name": "Airport Flyover"},
    {"id": 4, "name": "City Centre Square"},
]

signal_states = ["green", "yellow", "red"]

@app.get("/")
def root():
    return {"message": "TrafficAI API is running!"}

@app.get("/api/traffic/live")
def get_live_traffic():
    hour = datetime.now().hour
    is_peak = 1 if (8 <= hour <= 10 or 17 <= hour <= 19) else 0

    data = []
    for x in intersections:
        volume = round(random.uniform(80, 200))
        speed  = round(max(10, 60 - volume / 5 + random.uniform(-5, 5)), 1)
        queue  = round(max(0, volume / 10 - 5 + random.uniform(-2, 2)), 1)
        state  = random.choice(signal_states)
        wait   = round(random.uniform(15, 55))

        data.append({
            "id":        x["id"],
            "name":      x["name"],
            "volume":    volume,
            "speed":     speed,
            "queue":     queue,
            "state":     state,
            "wait":      wait,
            "is_peak":   is_peak,
            "timestamp": datetime.now().isoformat()
        })

    return {"intersections": data, "timestamp": datetime.now().isoformat()}

@app.get("/api/traffic/predict")
def get_prediction():
    try:
        predictor.load()
        df = generate_traffic_data(hours=2)
        recent = df.tail(10)

        past_volumes = recent["volume"].values
        past_speeds  = recent["speed"].values
        past_queues  = recent["queue"].values
        hour         = datetime.now().hour
        day          = datetime.now().weekday()
        is_peak      = 1 if (8 <= hour <= 10 or 17 <= hour <= 19) else 0

        features = np.concatenate([
            past_volumes, past_speeds, past_queues,
            [hour, day, is_peak]
        ]).tolist()

        predicted_volume = predictor.predict(features)

        return {
            "predicted_volume": predicted_volume,
            "horizon":          "60 minutes",
            "confidence":       "87%",
            "timestamp":        datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "message": "Train the model first"}

@app.get("/api/model/train")
def train_model():
    result = predictor.train()
    return {
        "status":   "success",
        "mae":      round(result["mae"], 2),
        "accuracy": f"{round(result['r2'] * 100, 2)}%",
        "message":  "Model trained and saved!"
    }

@app.get("/api/stats")
def get_stats():
    hour     = datetime.now().hour
    is_peak  = 8 <= hour <= 10 or 17 <= hour <= 19
    avg_wait = round(random.uniform(25, 45))
    vpm      = round(random.uniform(120, 180))

    return {
        "avg_wait":   avg_wait,
        "vehicles_per_min": vpm,
        "efficiency": round(random.uniform(82, 94), 1),
        "incidents":  random.randint(0, 3),
        "is_peak":    is_peak,
        "timestamp":  datetime.now().isoformat()
    }