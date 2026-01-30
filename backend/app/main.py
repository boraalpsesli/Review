from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import router as api_router
from app.api.v1.places import router as places_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.core.database import Base, engine, RedisClient
from app.models.review import RawReview # Register model
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
app.include_router(places_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(users_router, prefix="/api/v1/users")


@app.on_event("startup")
async def startup():
    logger.info("Starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await RedisClient.connect()
    logger.info("Database connections established")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down...")
    await RedisClient.close()


@app.get("/")
async def root():
    return {"message": "Restaurant Review Analyzer API", "version": "1.0.0"}
