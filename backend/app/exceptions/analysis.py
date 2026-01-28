"""Analysis-related exception classes."""
from .base import AppException


class ScrapingException(AppException):
    """Error during web scraping exception."""
    
    def __init__(self, message: str, url: str = None):
        super().__init__(
            message=f"Scraping failed: {message}",
            status_code=502,
            details={"url": url} if url else {}
        )


class AIAnalysisException(AppException):
    """Error during AI analysis exception."""
    
    def __init__(self, message: str):
        super().__init__(
            message=f"AI analysis failed: {message}",
            status_code=502
        )
