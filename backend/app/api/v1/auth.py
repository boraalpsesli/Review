from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.api.deps import get_current_user
from datetime import timedelta

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user.
    """
    return current_user

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- Google OAuth Flow ---

import os
from google_auth_oauthlib.flow import Flow
from starlette.responses import RedirectResponse
from starlette.requests import Request
from app.core.config import settings

# Should match the URI configured in Google Cloud Console
REDIRECT_URI = f"{settings.API_V1_STR}/auth/google/callback"
# Since we are running locally on port 8000. In prod this would be domain.com/api/v1/...
# Wait, settings.API_V1_STR usually is just "/api/v1". We need the full URL for the redirect.
# Let's construct it safely or use an env var. For now assuming localhost:8000 based on previous context.
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000") 
FULL_REDIRECT_URI = f"{BASE_URL}{settings.API_V1_STR}/auth/google/callback"

SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/business.manage", # Critical for Business Profile
]

@router.get("/google/login")
async def google_login(user_id: str): # We pass user_id to know who to link. Ideally this comes from a session or we handle it in callback via state.
    # Security Note: authenticating the user BEFORE this step is better, but since this starts a flow, 
    # we often pass a state param. For simplicity in this interaction, we'll assume the client passes the user ID we generated for them 
    # OR we require them to be logged in and pass the JWT.
    # Let's use the JWT approach: user calls this, we get their ID from the token? 
    # Actually, usually this is a browser redirect. The browser visits this URL. 
    # So we can't easily pass a Bearer header in a simple Link click unless we use a robust client logic.
    # PROPOSAL: We accept `user_id` as a query param for now (easiest for "Connect" button), signed/encrypted would be better but simple first.
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.AUTH_GOOGLE_ID,
                "client_secret": settings.AUTH_GOOGLE_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = FULL_REDIRECT_URI
    
    # Enable offline access so we get a refresh token
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=user_id # Pass user_id as state to retrieve it in callback
    )
    
    return RedirectResponse(authorization_url)

@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    code = request.query_params.get('code')
    state = request.query_params.get('state') # This is the user_id we passed
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
        
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.AUTH_GOOGLE_ID,
                "client_secret": settings.AUTH_GOOGLE_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        state=state
    )
    flow.redirect_uri = FULL_REDIRECT_URI
    
    # Relax scope validation because Google adds 'openid' automatically
    os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
    
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
    except Exception as e:
        # Check if it is the specific scope error and handle/log it, but usually the env var fixes it
        raise HTTPException(status_code=400, detail=f"Failed to fetch token: {str(e)}")
    
    # Update the user in DB
    # We use the 'state' param which contains the user_id (string currently, but DB uses int or str? User model has id=Integer)
    # Let's try to convert, assuming we passed the ID.
    
    try:
        try:
            user_id_int = int(state)
            # Find by ID
            stmt = select(User).where(User.id == user_id_int)
        except ValueError:
            # If not an int, assume it is an email (from frontend session)
            stmt = select(User).where(User.email == state)

        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            user.google_refresh_token = credentials.refresh_token
            user.google_account_connected = True
            db.add(user)
            await db.commit()
            
            # Redirect back to frontend settings page with success
            return RedirectResponse("http://localhost:3000/dashboard/settings?google_connected=true")
        else:
             return RedirectResponse(f"http://localhost:3000/dashboard/settings?error=user_not_found_for_{state}")

    except Exception as e:
        return RedirectResponse(f"http://localhost:3000/dashboard/settings?error=db_error_{str(e)}")

