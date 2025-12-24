@echo off
setlocal enabledelayedexpansion

REM
node -v >nul 2>&1
if errorlevel 1 (
    echo Downloading Node.js v24.12.0...
    
    REM
    powershell -Command "& {[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor [System.Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v24.12.0/node-v24.12.0-x64.msi', '%temp%\node-installer.msi')}"
    
    if exist "%temp%\node-installer.msi" (
        echo Installing Node.js...
        msiexec /i "%temp%\node-installer.msi" /qn
        
        REM
        timeout /t 30 /nobreak
        
        REM
        del "%temp%\node-installer.msi"
        
        REM
        call refreshenv.cmd
    ) else (
        echo Failed to download Node.js installer
        pause
        exit /b 1
    )
)

npm install
npm start