from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
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
