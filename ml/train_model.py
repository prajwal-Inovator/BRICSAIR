import requests
import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

import joblib


# ==========================================
# BENGALURU LOCATION
# ==========================================

LATITUDE = 12.9716
LONGITUDE = 77.5946


# ==========================================
# GET HISTORICAL AIR QUALITY DATA
# ==========================================

url = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    f"?latitude={LATITUDE}"
    f"&longitude={LONGITUDE}"
    "&hourly=pm2_5,pm10,carbon_monoxide,"
    "nitrogen_dioxide,sulphur_dioxide,ozone"
    "&past_days=90"
    "&timezone=auto"
)


print("Downloading historical air quality data...")

response = requests.get(url)

if response.status_code != 200:
    print("Failed to download data")
    print(response.text)
    exit()


data = response.json()


# ==========================================
# CREATE DATAFRAME
# ==========================================

hourly = data["hourly"]

df = pd.DataFrame({
    "time": hourly["time"],
    "pm25": hourly["pm2_5"],
    "pm10": hourly["pm10"],
    "co": hourly["carbon_monoxide"],
    "no2": hourly["nitrogen_dioxide"],
    "so2": hourly["sulphur_dioxide"],
    "o3": hourly["ozone"]
})


# ==========================================
# CLEAN DATA
# ==========================================

df = df.dropna()

print()
print("Historical records:", len(df))


# ==========================================
# CREATE TARGET
# ==========================================
# Predict the next PM2.5 value.
#
# Shift(-1) means:
#
# Current pollution → Next hour pollution
#
# ==========================================

df["target_pm25"] = df["pm25"].shift(-1)

df = df.dropna()


# ==========================================
# FEATURES
# ==========================================

features = [
    "pm25",
    "pm10",
    "co",
    "no2",
    "so2",
    "o3"
]


X = df[features]

y = df["target_pm25"]


# ==========================================
# TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# ==========================================
# MACHINE LEARNING MODEL
# ==========================================

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)


print()
print("Training machine learning model...")

model.fit(
    X_train,
    y_train
)


# ==========================================
# TEST MODEL
# ==========================================

predictions = model.predict(X_test)

mae = mean_absolute_error(
    y_test,
    predictions
)


print()
print("Model training completed.")

print(
    f"Mean Absolute Error: {mae:.2f}"
)


# ==========================================
# SAVE MODEL
# ==========================================

joblib.dump(
    model,
    "model.pkl"
)


print()
print("Model saved as:")
print("ml/model.pkl")