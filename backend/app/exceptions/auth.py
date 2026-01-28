"""Authentication-related exception classes."""
from .base import AppException


class InvalidCredentialsException(AppException):
    """Invalid email or password exception."""
    
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message=message, status_code=401)


class UserAlreadyExistsException(AppException):
    """User with this email already exists exception."""
    
    def __init__(self, email: str):
        super().__init__(
            message=f"User with email '{email}' already exists",
            status_code=409,
            details={"email": email}
        )


class TokenExpiredException(AppException):
    """Token has expired exception."""
    
    def __init__(self, message: str = "Token has expired"):
        super().__init__(message=message, status_code=401)
