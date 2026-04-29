# 🛡️ DeepGuard AI — Deepfake Detector

> **Production-grade AI deepfake detection platform** powered by EfficientNet transfer learning.  
> Upload images or videos → get Real/Fake predictions with confidence score, GradCAM heatmap, and downloadable PDF reports.

![Tech Stack](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![PyTorch](https://img.shields.io/badge/PyTorch-2.3-EE4C2C?logo=pytorch) ![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)

---

## 📁 Project Structure

```
AI deep fake detector/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, detections, admin)
│   │   ├── core/         # Config, security, logging
│   │   ├── db/           # SQLAlchemy engine + session
│   │   ├── models/       # ORM models (User, Detection)
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── services/     # Business logic (model, detection, auth, report)
│   │   ├── utils/        # File utilities
│   │   └── main.py       # FastAPI app entrypoint
│   ├── models/           # Drop trained .pth weights here
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, Footer, UI, ProtectedRoute
│   │   ├── context/      # AuthContext
│   │   ├── lib/          # API client
│   │   └── pages/        # Landing, Login, Register, Detect, Dashboard
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Local Setup (Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- pip

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file
copy ..\\.env.example .env
# Edit .env and set SECRET_KEY

# Start backend
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API Docs: http://localhost:8000/api/docs

### 2. Frontend

```bash
cd frontend

# Copy env
copy .env.example .env

# Install and run
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🐳 Docker Setup (Production)

```bash
# Copy and configure environment
copy .env.example .env
# Edit SECRET_KEY in .env

# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f backend
```

App runs at: http://localhost  
API: http://localhost:8000

---

## 🤖 AI Model

### Current Mode

Without trained weights, the app runs in **mock inference mode** — fully functional for demos with realistic confidence scores and synthetic heatmaps.

### Activating Real Detection

1. Train an EfficientNet-B4 model on a deepfake dataset (FaceForensics++, DFDC, etc.)
2. Save weights as PyTorch state dict:
   ```python
   torch.save(model.state_dict(), "models/deepfake_detector.pth")
   ```
3. Drop `deepfake_detector.pth` into the `backend/models/` folder
4. Restart the backend — it auto-loads weights on startup

### Training Scaffold

```python
from app.services.model_service import DeepfakeDetector
import torch

model = DeepfakeDetector(pretrained=True)  # loads ImageNet weights
# ... train on your dataset ...
torch.save(model.state_dict(), "models/deepfake_detector.pth")
```

---

## 📡 API Reference

| Endpoint                           | Method | Auth      | Description                 |
| ---------------------------------- | ------ | --------- | --------------------------- |
| `/api/health`                      | GET    | No        | Health check + model status |
| `/api/v1/auth/register`            | POST   | No        | Register new user           |
| `/api/v1/auth/login`               | POST   | No        | Login + get JWT             |
| `/api/v1/auth/me`                  | GET    | JWT       | Current user info           |
| `/api/v1/detections/analyze/image` | POST   | JWT       | Analyze image file          |
| `/api/v1/detections/analyze/video` | POST   | JWT       | Analyze video file          |
| `/api/v1/detections/`              | GET    | JWT       | List detection history      |
| `/api/v1/detections/stats`         | GET    | JWT       | Dashboard statistics        |
| `/api/v1/detections/{id}`          | GET    | JWT       | Get single detection        |
| `/api/v1/detections/{id}`          | DELETE | JWT       | Delete detection            |
| `/api/v1/detections/{id}/report`   | POST   | JWT       | Download PDF report         |
| `/api/v1/admin/stats`              | GET    | Admin JWT | Platform analytics          |

Full interactive docs: http://localhost:8000/api/docs

---

## ☁️ Deployment

### Render / Railway (Backend)

1. Connect your GitHub repo
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add env vars: `SECRET_KEY`, `DATABASE_URL` (PostgreSQL), `ENVIRONMENT=production`

### PostgreSQL (Production DB)

Change in `.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/deepfake_db
```

No code changes needed — SQLAlchemy handles both.

---

## 🔒 Security Features

- JWT authentication with configurable expiry
- bcrypt password hashing
- File type + size validation
- Filename sanitization (path traversal prevention)
- Rate limiting on upload endpoints
- CORS origin allowlist
- Global exception handler (no stack traces in production)

---

## 📄 License

MIT — built for professional portfolio and production use.
