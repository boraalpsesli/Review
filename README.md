# Restaurant Review Analysis SaaS

A B2B SaaS platform for analyzing restaurant reviews from Google Maps using AI.

## Features

- 🔍 **Web Scraping**: Automated Google Maps review scraper using Playwright
- 🤖 **AI Analysis**: Google Gemini AI for sentiment analysis and insights
- 📊 **Dual Database**: PostgreSQL for structured data, MongoDB for raw reviews
- ⚡ **Async Processing**: Celery task queue for background processing
- 🚀 **REST API**: FastAPI-based REST API
- 🐳 **Containerized**: Full Docker Compose setup

## Architecture

```
┌─────────────┐
│   Client    │
│  (Flutter)  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   FastAPI       │
│   Backend       │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│  Celery │ │PostgreSQL│
│  Worker │ │ MongoDB  │
└─────────┘ └──────────┘
     │
     ▼
┌─────────────┐
│  Playwright │
│  + Gemini   │
└─────────────┘
```

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Task Queue**: Celery + Redis
- **Databases**: PostgreSQL + MongoDB
- **Scraper**: Playwright
- **AI**: Google Gemini API

### Frontend
- **Framework**: Flutter (Mobile-first)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Google Gemini API Key

### Setup

1. Clone the repository
```bash
cd restaurant_saas
```

2. Set up environment variables
```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

3. Start services with Docker Compose
```bash
cd ..
docker-compose up -d
```

4. Access the API
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Usage

### 1. Queue an Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "google_maps_url": "https://www.google.com/maps/place/Your+Restaurant"
  }'
```

Response:
```json
{
  "task_id": "a1b2c3d4-e5f6-7890",
  "status": "PENDING",
  "message": "Analysis task queued successfully"
}
```

### 2. Check Task Status
```bash
curl "http://localhost:8000/api/v1/status/a1b2c3d4-e5f6-7890"
```

Response:
```json
{
  "task_id": "a1b2c3d4-e5f6-7890",
  "status": "SUCCESS",
  "result": {
    "sentiment_score": 0.75,
    "summary": "Overall positive reviews...",
    "complaints": ["Slow service", "High prices"],
    "praises": ["Great food", "Nice ambiance"],
    "reviews_analyzed": 45
  }
}
```

## Project Structure

```
restaurant_saas/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints.py     # FastAPI routes
│   │   ├── core/
│   │   │   ├── config.py            # Configuration
│   │   │   └── database.py          # DB connections
│   │   ├── models/
│   │   │   └── restaurant.py        # SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── analysis.py          # Pydantic schemas
│   │   ├── services/
│   │   │   ├── scraper.py          # Playwright scraper
│   │   │   └── ai_analyzer.py      # Gemini AI service
│   │   ├── worker/
│   │   │   ├── celery_app.py       # Celery config
│   │   │   └── tasks.py            # Celery tasks
│   │   └── main.py                 # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── mobile_app/                     # Flutter app (to be implemented)
└── docker-compose.yml             # Docker orchestration
```

## Development

### Running Locally (without Docker)

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

2. Start services (PostgreSQL, MongoDB, Redis):
```bash
# Use Docker for services only
docker-compose up postgres mongodb redis -d
```

3. Run the FastAPI server:
```bash
python -m uvicorn app.main:app --reload
```

4. Run Celery worker:
```bash
celery -A app.worker.celery_app worker --loglevel=info
```

## Environment Variables

See `backend/.env.example` for all available configuration options.

Key variables:
- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `POSTGRES_*`: PostgreSQL connection settings
- `MONGO_URL`: MongoDB connection URL
- `REDIS_HOST`: Redis host for Celery

## Database Schema

### PostgreSQL Tables

#### restaurants
- id, name, google_maps_url, address, rating, total_reviews
- created_at, updated_at

#### analysis_reports
- id, restaurant_id, task_id
- sentiment_score, summary, complaints, praises
- reviews_analyzed, analysis_date, raw_ai_response

### MongoDB Collections

#### raw_reviews
- google_maps_url, restaurant_info, reviews[]
- scraped_at, stored_at

## License

MIT License

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.
