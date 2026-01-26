# Restaurant Review Analysis - Test Script
# This script tests the API endpoints

Write-Host "=== Restaurant Review Analysis API Test ===" -ForegroundColor Green
Write-Host ""

# 1. Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method Get
Write-Host "✓ Health Status: $($health.status)" -ForegroundColor Green
Write-Host ""

# 2. Submit Analysis
Write-Host "2. Submitting Analysis Request..." -ForegroundColor Cyan
Write-Host "   NOTE: Replace this URL with an actual Google Maps restaurant URL" -ForegroundColor Yellow

$body = @{
    google_maps_url = "https://www.google.com/maps/place/Restaurant+Name"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analyze" `
                                  -Method Post `
                                  -Body $body `
                                  -ContentType "application/json"
    
    $taskId = $response.task_id
    Write-Host "✓ Task Queued Successfully!" -ForegroundColor Green
    Write-Host "  Task ID: $taskId" -ForegroundColor White
    Write-Host ""
    
    # 3. Check Status
    Write-Host "3. Checking Task Status..." -ForegroundColor Cyan
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 2
        $attempt++
        
        $status = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/status/$taskId" -Method Get
        Write-Host "  Attempt $attempt : Status = $($status.status)" -ForegroundColor Yellow
        
        if ($status.status -eq "SUCCESS") {
            Write-Host ""
            Write-Host "✓ Analysis Complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "=== Results ===" -ForegroundColor Cyan
            Write-Host "  Sentiment Score: $($status.result.sentiment_score)" -ForegroundColor White
            Write-Host "  Reviews Analyzed: $($status.result.reviews_analyzed)" -ForegroundColor White
            Write-Host "  Summary: $($status.result.summary)" -ForegroundColor White
            Write-Host ""
            Write-Host "  Complaints:" -ForegroundColor Red
            $status.result.complaints | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
            Write-Host ""
            Write-Host "  Praises:" -ForegroundColor Green
            $status.result.praises | ForEach-Object { Write-Host "    - $_" -ForegroundColor Green }
            break
        }
        elseif ($status.status -eq "FAILURE") {
            Write-Host ""
            Write-Host "✗ Task Failed!" -ForegroundColor Red
            Write-Host "  Error: $($status.error)" -ForegroundColor Red
            break
        }
        
    } while ($attempt -lt $maxAttempts)
    
    if ($attempt -eq $maxAttempts) {
        Write-Host ""
        Write-Host "⚠ Task still running after $maxAttempts attempts" -ForegroundColor Yellow
        Write-Host "  Check status manually at: http://localhost:8000/api/v1/status/$taskId"
    }
    
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Yellow
    Write-Host "  - Make sure you have GEMINI_API_KEY set in .env" -ForegroundColor White
    Write-Host "  - Make sure the Google Maps URL is valid" -ForegroundColor White
    Write-Host "  - Check logs: docker-compose logs celery-worker" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
