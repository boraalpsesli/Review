# Custom exceptions module
from .base import AppException, NotFoundException, ValidationException, AuthenticationException
from .auth import InvalidCredentialsException, UserAlreadyExistsException, TokenExpiredException
from .analysis import ScrapingException, AIAnalysisException

__all__ = [
    "AppException",
    "NotFoundException",
    "ValidationException",
    "AuthenticationException",
    "InvalidCredentialsException",
    "UserAlreadyExistsException",
    "TokenExpiredException",
    "ScrapingException",
    "AIAnalysisException",
]
