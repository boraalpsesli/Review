from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
import redis.asyncio as redis
from app.core.config import settings

engine = create_async_engine(settings.postgres_url, echo=True, future=True)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


class MongoDB:
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect(cls):
        cls.client = AsyncIOMotorClient(settings.MONGO_URL)
        
    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
    
    @classmethod
    def get_database(cls):
        return cls.client[settings.MONGO_DB]
    
    @classmethod
    def get_collection(cls, collection_name: str):
        db = cls.get_database()
        return db[collection_name]


def get_mongo_collection(collection_name: str):
    return MongoDB.get_collection(collection_name)


class RedisClient:
    client: redis.Redis = None
    
    @classmethod
    async def connect(cls):
        redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
        cls.client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        
    @classmethod
    async def close(cls):
        if cls.client:
            await cls.client.close()
            
    @classmethod
    def get_client(cls):
        return cls.client
