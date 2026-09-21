from pydantic import BaseModel, EmailStr


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class AdminProfileUpdateRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None


class AdminPasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str
