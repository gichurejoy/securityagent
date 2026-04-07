from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime

from .. import models, schemas
from ..database import get_db, get_eat_time
from ..auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.ITUser).filter(models.ITUser.email == form_data.username).first()
    
    # Auto-seed the admin user on first login attempt if no users exist
    if not user and form_data.username == "admin@company.com" and form_data.password == "admin":
         if not db.query(models.ITUser).first():
              user = models.ITUser(
                  email="admin@company.com", 
                  name="System Admin", 
                  role=models.ITUserRole.ADMIN, 
                  hashed_password=get_password_hash("admin")
              )
              db.add(user)
              db.commit()
              db.refresh(user)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
         raise HTTPException(
             status_code=status.HTTP_401_UNAUTHORIZED,
             detail="Incorrect email or password",
             headers={"WWW-Authenticate": "Bearer"},
         )
    
    user.last_login_at = get_eat_time()
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
