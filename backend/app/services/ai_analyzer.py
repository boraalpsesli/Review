"""
Google Gemini AI Service for review analysis
"""
import google.generativeai as genai
from typing import List, Dict
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiAnalyzer:
    """Google Gemini AI analyzer for restaurant reviews"""
    
    def __init__(self):
        """Initialize Google Gemini with API key"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Initialize the model - using gemini-2.5-flash (latest stable model)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def analyze_reviews(self, reviews: List[Dict], restaurant_name: str = "Restaurant") -> Dict:
        """
        Analyze restaurant reviews using Google Gemini AI
        
        Args:
            reviews: List of review dictionaries with 'text' and 'rating' fields
            restaurant_name: Name of the restaurant
            
        Returns:
            Dictionary with sentiment_score, summary, complaints, and praises
        """
        if not reviews:
            return {
                "sentiment_score": 0.0,
                "summary": "No reviews available for analysis.",
                "complaints": [],
                "praises": [],
                "reviews_analyzed": 0
            }
        
        # Prepare review text for analysis
        reviews_text = self._prepare_reviews_text(reviews)
        
        # Create analysis prompt
        prompt = self._create_analysis_prompt(reviews_text, restaurant_name, len(reviews))
        
        try:
            # Define the JSON schema for structured output
            # This forces Gemini to return complete, valid JSON
            schema = {
                "type": "object",
                "properties": {
                    "sentiment_score": {"type": "number"},
                    "summary": {"type": "string"},
                    "complaints": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "praises": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["sentiment_score", "summary", "complaints", "praises"]
            }
            
            # Use async generation with JSON schema
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=8192,  # Increased to prevent truncation
                    response_mime_type="application/json",
                    response_schema=schema,  # Add schema for complete JSON
                )
            )
            
            # Parse the response
            ai_response = response.text
            result = self._parse_ai_response(ai_response, len(reviews))
            
            logger.info(f"Analysis completed: sentiment={result['sentiment_score']}")
            return result
            
        except Exception as e:
            logger.error(f"Error during AI analysis: {str(e)}")
            # Return fallback analysis based on ratings
            return self._fallback_analysis(reviews)
    
    def _prepare_reviews_text(self, reviews: List[Dict]) -> str:
        """Prepare reviews text for AI analysis"""
        reviews_formatted = []
        
        for i, review in enumerate(reviews[:50], 1):  # Limit to 50 reviews for token limits
            rating = review.get('rating', 'N/A')
            text = review.get('text', '').strip()
            
            if text:
                reviews_formatted.append(f"Review {i} (Rating: {rating}/5):\n{text}\n")
        
        return "\n".join(reviews_formatted)
    
    def _create_analysis_prompt(self, reviews_text: str, restaurant_name: str, total_reviews: int) -> str:
        """Create the analysis prompt for Gemini"""
        prompt = f"""Analyze these {total_reviews} customer reviews for "{restaurant_name}".

Reviews:
{reviews_text}

Provide analysis in this exact JSON format:
{{
    "sentiment_score": <float between -1.0 and 1.0, where -1 is very negative, 0 is neutral, 1 is very positive>,
    "summary": "<A concise 2-3 sentence summary of overall customer sentiment and key themes>",
    "complaints": [<list of 3-5 most common complaints>],
    "praises": [<list of 3-5 most common positive aspects>]
}}

Rules:
- Base sentiment_score on overall tone
- Be specific (e.g., "slow service during peak hours" not just "slow service")
- Only include issues/praises mentioned in multiple reviews
- Each complaint/praise: 5-10 words max
- Return ONLY valid JSON, no markdown or extra text"""
        
        return prompt
    
    def _parse_ai_response(self, response_text: str, reviews_count: int) -> Dict:
        """Parse AI response and extract structured data"""
        try:
            response_text = response_text.strip()
            
            # Log raw response for debugging
            logger.debug(f"Raw AI response (first 500 chars): {response_text[:500]}")
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Try to extract JSON object if there's extra text
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                response_text = json_match.group(0)
            
            # Parse JSON
            result = json.loads(response_text)
            
            # Validate and normalize
            sentiment_score = float(result.get('sentiment_score', 0.0))
            sentiment_score = max(-1.0, min(1.0, sentiment_score))
            
            return {
                "sentiment_score": sentiment_score,
                "summary": result.get('summary', ''),
                "complaints": result.get('complaints', [])[:5],
                "praises": result.get('praises', [])[:5],
                "reviews_analyzed": reviews_count
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {str(e)}")
            logger.error(f"Response text (first 1000 chars): {response_text[:1000]}")
            raise
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            raise
    
    def _fallback_analysis(self, reviews: List[Dict]) -> Dict:
        """Fallback analysis based on ratings when AI fails"""
        ratings = [r.get('rating', 0) for r in reviews if r.get('rating')]
        
        if not ratings:
            avg_rating = 0
        else:
            avg_rating = sum(ratings) / len(ratings)
        
        # Convert 1-5 rating to -1 to 1 sentiment
        sentiment_score = (avg_rating - 3) / 2
        
        return {
            "sentiment_score": round(sentiment_score, 2),
            "summary": f"Based on {len(reviews)} reviews with an average rating of {avg_rating:.1f}/5.",
            "complaints": ["Analysis unavailable - AI service error"],
            "praises": ["Analysis unavailable - AI service error"],
            "reviews_analyzed": len(reviews)
        }
