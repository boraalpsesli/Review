import google.generativeai as genai
from typing import List, Dict
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiAnalyzer:
    
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def analyze_reviews(self, reviews: List[Dict], restaurant_name: str = "Restaurant") -> Dict:
        if not reviews:
            return {
                "sentiment_score": 0.0,
                "summary": "No reviews available for analysis.",
                "complaints": [],
                "praises": [],
                "reviews_analyzed": 0
            }
        
        reviews_text = self._prepare_reviews_text(reviews)
        prompt = self._create_analysis_prompt(reviews_text, restaurant_name, len(reviews))
        
        try:
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
            
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=8192,
                    response_mime_type="application/json",
                    response_schema=schema,
                )
            )
            
            ai_response = response.text
            result = self._parse_ai_response(ai_response, len(reviews))
            
            logger.info(f"Analysis completed: sentiment={result['sentiment_score']}")
            return result
            
        except Exception as e:
            logger.error(f"Error during AI analysis: {str(e)}")
            return self._fallback_analysis(reviews)
    
    def _prepare_reviews_text(self, reviews: List[Dict]) -> str:
        reviews_formatted = []
        
        for i, review in enumerate(reviews[:50], 1):
            rating = review.get('rating', 'N/A')
            text = review.get('text', '').strip()
            
            if text:
                reviews_formatted.append(f"Review {i} (Rating: {rating}/5):\n{text}\n")
        
        return "\n".join(reviews_formatted)
    
    def _create_analysis_prompt(self, reviews_text: str, restaurant_name: str, total_reviews: int) -> str:
        prompt = f"""Analyze these {total_reviews} customer reviews for "{restaurant_name}".

Reviews:
{reviews_text}

Provide analysis in this exact JSON format:
{{
    "sentiment_score": <float between -1.0 and 1.0, where -1 is very negative, 0 is neutral, 1 is very positive>,
    "summary": "<A concise 2-3 sentence summary of overall customer sentiment and key themes>",
    "complaints": [<list of 3-5 issues, criticisms, or areas for improvement mentioned in reviews>],
    "praises": [<list of 3-5 most common positive aspects>]
}}

Rules:
- Base sentiment_score on overall tone
- Be specific (e.g., "slow service during peak hours" not just "slow service")
- IMPORTANT: Always identify at least 2-3 complaints/areas for improvement, even from mostly positive reviews. Look for subtle criticisms, suggestions, or "could be better" comments.
- If reviews mention negative experiences, ALWAYS include them in complaints
- Each complaint/praise: 5-10 words max
- Return ONLY valid JSON, no markdown or extra text"""
        
        return prompt
    
    def _parse_ai_response(self, response_text: str, reviews_count: int) -> Dict:
        try:
            response_text = response_text.strip()
            
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                response_text = json_match.group(0)
            
            result = json.loads(response_text)
            
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
            raise
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            raise
    
    def _fallback_analysis(self, reviews: List[Dict]) -> Dict:
        ratings = [r.get('rating', 0) for r in reviews if r.get('rating')]
        
        if not ratings:
            avg_rating = 0
        else:
            avg_rating = sum(ratings) / len(ratings)
        
        sentiment_score = (avg_rating - 3) / 2
        
        return {
            "sentiment_score": round(sentiment_score, 2),
            "summary": f"Based on {len(reviews)} reviews with an average rating of {avg_rating:.1f}/5.",
            "complaints": ["Analysis unavailable - AI service error"],
            "praises": ["Analysis unavailable - AI service error"],
            "reviews_analyzed": len(reviews)
        }
