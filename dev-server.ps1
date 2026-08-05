$port = 3000
Write-Host "Starting server at http://localhost:$port" -ForegroundColor Green
Start-Process "http://localhost:$port"
npx serve . --port $port --no-clipboard
