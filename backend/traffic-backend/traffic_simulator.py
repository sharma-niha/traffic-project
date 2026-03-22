import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_traffic_data(hours=24*7):
    timestamps = []
    volumes = []
    speeds = []
    queues = []

    base_time = datetime.now() - timedelta(hours=hours)

    for i in range(hours * 12):
        t = base_time + timedelta(minutes=i * 5)
        hour = t.hour
        day = t.weekday()

        # Morning peak 8-10am, evening peak 5-7pm
        if 8 <= hour <= 10:
            base_volume = 180
        elif 17 <= hour <= 19:
            base_volume = 200
        elif 23 <= hour or hour <= 5:
            base_volume = 40
        else:
            base_volume = 110

        # Weekend is lighter
        if day >= 5:
            base_volume *= 0.6

        noise = np.random.normal(0, 10)
        volume = max(10, base_volume + noise)
        speed = max(10, 60 - (volume / 5) + np.random.normal(0, 3))
        queue = max(0, (volume / 10) - 5 + np.random.normal(0, 2))

        timestamps.append(t)
        volumes.append(round(volume, 1))
        speeds.append(round(speed, 1))
        queues.append(round(queue, 1))

    df = pd.DataFrame({
        "timestamp": timestamps,
        "volume": volumes,
        "speed": speeds,
        "queue": queues,
        "hour": [t.hour for t in timestamps],
        "day_of_week": [t.weekday() for t in timestamps],
        "is_peak": [1 if (8 <= t.hour <= 10 or 17 <= t.hour <= 19) else 0 for t in timestamps]
    })

    return df

if __name__ == "__main__":
    df = generate_traffic_data()
    df.to_csv("traffic_data.csv", index=False)
    print(f"Generated {len(df)} traffic records")
    print(df.head(10))