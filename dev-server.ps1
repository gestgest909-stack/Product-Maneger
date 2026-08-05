$port = 5173
Write-Host "Starting Vite dev server at http://localhost:$port" -ForegroundColor Green
Start-Process "http://localhost:$port"
npm run dev
