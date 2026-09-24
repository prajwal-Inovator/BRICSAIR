import sys
import json
import os
import joblib
import pandas as pd


# --------------------------------------------------
# MODEL PATH
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# CHECK INPUT
# --------------------------------------------------

if len(sys.argv) != 7:
    print(
        json.dumps(
            {
                "error": "Expected 6 values: pm25 pm10 co no2 so2 o3"
            }
        )
    )
    sys.exit(1)


# --------------------------------------------------
# INPUT VALUES
# --------------------------------------------------

pm25 = float(sys.argv[1])
pm10 = float(sys.argv[2])
co = float(sys.argv[3])
no2 = float(sys.argv[4])
so2 = float(sys.argv[5])
o3 = float(sys.argv[6])


# --------------------------------------------------
# CREATE INPUT USING THE SAME FEATURE NAMES
# USED DURING MODEL TRAINING
# --------------------------------------------------

input_data = pd.DataFrame(
    [
        {
            "pm25": pm25,
            "pm10": pm10,
            "co": co,
            "no2": no2,
            "so2": so2,
            "o3": o3,
        }
    ]
)


# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

prediction = model.predict(input_data)[0]

predicted_pm25 = round(float(prediction), 2)


# --------------------------------------------------
# STATUS
# --------------------------------------------------

if predicted_pm25 <= 12:
    status = "Good"
elif predicted_pm25 <= 35:
    status = "Moderate"
elif predicted_pm25 <= 55:
    status = "Unhealthy for Sensitive Groups"
elif predicted_pm25 <= 150:
    status = "Unhealthy"
else:
    status = "Very Unhealthy"


# --------------------------------------------------
# RESULT
# --------------------------------------------------

result = {
    "predictedPM25": predicted_pm25,
    "status": status,
    "predictionTime": "Next Hour",
    "model": "Random Forest",
}


print(json.dumps(result))