import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
from traffic_simulator import generate_traffic_data

class TrafficPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.is_trained = False

    def prepare_features(self, df):
        features = []
        targets = []

        for i in range(10, len(df) - 12):
            # Last 10 readings as input features
            past_volumes = df["volume"].iloc[i-10:i].values
            past_speeds  = df["speed"].iloc[i-10:i].values
            past_queues  = df["queue"].iloc[i-10:i].values

            hour        = df["hour"].iloc[i]
            day         = df["day_of_week"].iloc[i]
            is_peak     = df["is_peak"].iloc[i]

            feature_row = np.concatenate([
                past_volumes, past_speeds, past_queues,
                [hour, day, is_peak]
            ])
            features.append(feature_row)

            # Predict volume 12 steps (1 hour) ahead
            targets.append(df["volume"].iloc[i + 12])

        return np.array(features), np.array(targets)

    def train(self):
        print("Generating traffic data...")
        df = generate_traffic_data(hours=24*14)

        print("Preparing features...")
        X, y = self.prepare_features(df)

        # Split into train and test
        split = int(len(X) * 0.8)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]

        print("Training Random Forest model...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled  = self.scaler.transform(X_test)

        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True

        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        r2  = r2_score(y_test, y_pred)

        print(f"Model trained successfully!")
        print(f"MAE  : {mae:.2f} vehicles/min")
        print(f"R2   : {r2:.4f}")
        print(f"Accuracy: {round(r2 * 100, 2)}%")

        # Save model
        with open("model.pkl", "wb") as f:
            pickle.dump(self.model, f)
        with open("scaler.pkl", "wb") as f:
            pickle.dump(self.scaler, f)

        print("Model saved to model.pkl")
        return {"mae": mae, "r2": r2}

    def predict(self, recent_data: list):
        if not self.is_trained:
            self.load()

        features = np.array(recent_data).reshape(1, -1)
        features_scaled = self.scaler.transform(features)
        prediction = self.model.predict(features_scaled)[0]
        return round(float(prediction), 1)

    def load(self):
        with open("model.pkl", "rb") as f:
            self.model = pickle.load(f)
        with open("scaler.pkl", "rb") as f:
            self.scaler = pickle.load(f)
        self.is_trained = True
        print("Model loaded from disk")

if __name__ == "__main__":
    predictor = TrafficPredictor()
    predictor.train()