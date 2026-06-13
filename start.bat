@echo off
echo ============================================
echo   JetNexus AI -- IRROPS Yonetim Sistemi
echo ============================================
echo.

REM Backend + infrastructure
echo [1/2] Backend servisler baslatiliyor...
docker compose up -d postgres redis
timeout /t 3 /nobreak >nul

REM Decision engine
echo [2/2] Decision Engine baslatiliyor...
cd services\decision-engine
pip install -r requirements.txt -q
start /b python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
cd ..\..

REM Frontend
echo [3/3] Frontend baslatiliyor...
cd frontend
start /b npm run dev
cd ..

echo.
echo ============================================
echo   Sistem Hazir!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo ============================================
pause
