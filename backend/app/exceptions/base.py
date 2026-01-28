"""Base exception classes for the application."""
from typing import Optional, Dict, Any


class AppException(Exception):
    """Base application exception."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found exception."""
    
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} with identifier '{identifier}' not found",
            status_code=404,
            details={"resource": resource, "identifier": str(identifier)}
        )


class ValidationException(AppException):
    """Validation error exception."""
    
    def __init__(self, message: str, errors: Optional[Dict[str, str]] = None):
        super().__init__(
            message=message,
            status_code=422,
            details={"validation_errors": errors or {}}
        )


class AuthenticationException(AppException):
    """Authentication error exception."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message, status_code=401)
