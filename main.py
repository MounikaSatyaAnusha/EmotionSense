from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional
import numpy as np
import uvicorn
import shutil
import joblib
import os
from io import BytesIO
from PIL import Image

# FastAPI app
app = FastAPI()

# Load model and vectorizer once when the app starts
MODEL_PATH = "text_model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"
FACE_MODEL_PATH = "face_model.pkl"
FACE_SCALER_PATH = "face_scaler.pkl"

if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
else:
    raise FileNotFoundError("Model or vectorizer file not found.")

if os.path.exists(FACE_MODEL_PATH) and os.path.exists(FACE_SCALER_PATH):
    face_model = joblib.load(FACE_MODEL_PATH)
    face_scaler = joblib.load(FACE_SCALER_PATH)
else:
    raise FileNotFoundError("Face model or scaler not found.")

emoji_map = {
    "joy": "😊",
    "sadness": "😢",
    "anger": "😠",
    "fear": "😨",
    "surprise": "😲",
    "love": "❤️",
    "neutral": "😐"
}

suggestions = {
    "joy": ["Celebrate your happiness!", "Share your joy with someone."],
    "sadness": ["Talk to someone you trust.", "Try writing about how you feel."],
    "anger": ["Take deep breaths.", "Give yourself time to cool down."],
    "fear": ["You are stronger than you think.", "Focus on what you can control."],
    "surprise": ["Be open to unexpected things.", "Embrace the new!"],
    "love": ["Cherish the people around you.", "Express your care openly."]
}
# CORS (optional but useful if testing frontend separately)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ========== Routes for HTML Pages ==========

@app.get("/", response_class=HTMLResponse)
async def read_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/text-emotion", response_class=HTMLResponse)
async def text_emotion_ui(request: Request):
    return templates.TemplateResponse("text-emotion.html", {"request": request})

@app.get("/face-emotion", response_class=HTMLResponse)
async def face_emotion_ui(request: Request):
    return templates.TemplateResponse("face-emotion.html", {"request": request})

@app.get("/history", response_class=HTMLResponse)
async def history_ui(request: Request):
    return templates.TemplateResponse("history.html", {"request": request})

# ========== Sample API Endpoint for Text Prediction ==========

@app.post("/predict-text-emotion")
async def predict_text_emotion(request: Request, user_input: str = Form(...)):
    X = vectorizer.transform([user_input])
    prediction = model.predict(X)[0]
    emoji = emoji_map.get(prediction, "")
    tips = suggestions.get(prediction, [])
    return templates.TemplateResponse("text-emotion.html", {
        "request": request,
        "prediction": prediction,
        "emoji": emoji,
        "user_input": user_input,
        "suggestions": tips
    })


# ========== API for Face Emotion ==========


label_map = {
    0: "joy",
    1: "sadness",
    2: "anger",
    3: "fear",
    4: "surprise",
    5: "neutral"
}

@app.post("/predict-face")
async def predict_face(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        image = image.resize((48, 48))

        # Convert to grayscale and flatten
        gray = np.array(image.convert("L")).flatten().reshape(1, -1)

        # Scale input
        gray_scaled = face_scaler.transform(gray)

        # Predict
        prediction_idx = face_model.predict(gray_scaled)[0]
        prediction_label = label_map.get(prediction_idx, "unknown")
        print("🎯 Prediction Index:", prediction_idx)
        print("🧠 Emotion:", prediction_label)


        # Get confidence
        if hasattr(face_model, "predict_proba"):
            proba = face_model.predict_proba(gray_scaled)[0]
            confidence = round(float(np.max(proba)) * 100, 2)
            emotion_scores = {
                label_map[i]: round(float(prob) * 100, 2)
                for i, prob in enumerate(proba)
                if i in label_map
            }
        else:
            confidence = "0"
            emotion_scores = {}

        emoji = emoji_map.get(prediction_label, "🤔")
        tips = suggestions.get(prediction_label, [])
        print("📊 Confidence:", confidence)
        print("🎭 Emoji used:", emoji)
        return JSONResponse({
            "primaryEmotion": prediction_label,
            "emoji": emoji,
            "confidence": confidence,
            "scores": emotion_scores,
            "suggestions": tips
        })

    except Exception as e:
        print("❌ Error in prediction:", str(e))
        return JSONResponse({"error": str(e)}, status_code=500)
# ========== Run Server ==========

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
