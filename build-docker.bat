@echo off
setlocal enabledelayedexpansion

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo.
echo Building Docker image...
docker build -t graphtheory:latest .

if errorlevel 1 (
    echo.
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Image built successfully!
echo.
echo To run the container:
echo   docker run -p 3000:3000 graphtheory:latest
echo.
echo Or use docker-compose:
echo   docker-compose up
echo.
pause
