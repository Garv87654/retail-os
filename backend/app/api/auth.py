from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database.session import get_db
from app.models.models import User, Role
from app.schemas.schemas import UserCreate, UserResponse, Token
from app.auth.security import (
    create_access_token, 
    create_refresh_token, 
    get_password_hash, 
    verify_password,
    SECRET_KEY,
    ALGORITHM
)
from app.utils.audit import log_event

# To support the OAuth2 login flow we define standard auth.
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Check role
    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{user_in.role_name}' does not exist"
        )
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role_id=role.id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_event(db, "REGISTER", f"Registered new user {new_user.username} with role {role.name}", new_user.id, new_user.username)
    
    # Create manual response dict to pass role_name
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        role_name=role.name,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    role_name = user.role.name if user.role else "Viewer"
    access_token = create_access_token(data={"sub": user.username, "role": role_name})
    
    log_event(db, "LOGIN", f"User {user.username} logged in successfully", user.id, user.username)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name
    }

@router.post("/logout")
def logout(db: Session = Depends(get_db)):
    # JWT is stateless, logout is handled client-side by dropping token, 
    # but we log it or return confirmation.
    return {"detail": "Logged out successfully"}

@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)):
    # Email mock implementation
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    log_event(db, "FORGOT_PASSWORD", f"Password reset requested for {email}", user.id, user.username)
    return {"detail": f"Password reset instructions sent to {email} (Simulated)"}

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        is_refresh: bool = payload.get("refresh", False)
        if username is None or not is_refresh:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    role_name = user.role.name if user.role else "Viewer"
    access_token = create_access_token(data={"sub": user.username, "role": role_name})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name
    }
