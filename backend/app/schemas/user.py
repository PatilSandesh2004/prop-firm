import uuid

from pydantic import BaseModel, EmailStr

from app.core.constants import Role

from .common import TimestampSchema


class UserBase(BaseModel):
    email: EmailStr
    role: Role = Role.TRADER


class UserCreate(UserBase):
    password: str


class UserRead(UserBase, TimestampSchema):
    id: uuid.UUID
    is_active: bool
