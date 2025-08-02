@echo off
echo Testing Document Processing with cURL
echo =====================================

echo.
echo Test 1: Small Document Test
echo ----------------------------
curl -X POST "http://localhost:3000/api/ai-proxy" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"Summarize this document\",\"attachments\":[{\"name\":\"test.pdf\",\"content\":\"This is a small test document for verification.\"}],\"history\":[],\"messageCount\":0}" ^
  --max-time 30 ^
  --write-out "\nTime: %%{time_total}s\nStatus: %%{http_code}\n" ^
  --silent --show-error

echo.
echo =====================================
echo Test 2: Medium Document Test
echo ----------------------------
set "mediumContent=Executive Summary: This comprehensive report analyzes market trends. "
curl -X POST "http://localhost:3000/api/ai-proxy" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"Analyze this report\",\"attachments\":[{\"name\":\"report.pdf\",\"content\":\"%mediumContent%\"}],\"history\":[],\"messageCount\":0}" ^
  --max-time 30 ^
  --write-out "\nTime: %%{time_total}s\nStatus: %%{http_code}\n" ^
  --silent --show-error

echo.
echo =====================================
echo Test 3: Control Test (No Document)
echo ----------------------------
curl -X POST "http://localhost:3000/api/ai-proxy" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"Hello, how are you?\",\"history\":[],\"messageCount\":0}" ^
  --max-time 30 ^
  --write-out "\nTime: %%{time_total}s\nStatus: %%{http_code}\n" ^
  --silent --show-error

echo.
echo =====================================
echo Testing Complete
echo =====================================
pause
