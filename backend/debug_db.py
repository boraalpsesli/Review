import asyncio
import sys
import os

# Ensure app is in path
sys.path.append(os.getcwd())

from app.core.database import async_session_maker
from app.models.restaurant import AnalysisReport
from sqlalchemy import select

async def main():
    try:
        async with async_session_maker() as session:
            print("Connected to DB")
            result = await session.execute(select(AnalysisReport))
            reports = result.scalars().all()
            print(f"Found {len(reports)} reports")
            for r in reports:
                print(f"ID: {r.id}, User: {r.user_id}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
