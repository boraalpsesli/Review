from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import router as api_router
from app.core.database import Base, engine, MongoDB
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Restaurant Review Analyzer",
    description="AI-powered restaurant review analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    logger.info("Starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await MongoDB.connect()
    logger.info("Database connections established")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down...")
    await MongoDB.close()


@app.get("/")
async def root():
    return {"message": "Restaurant Review Analyzer API", "version": "1.0.0"}
