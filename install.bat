@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  Tagger Installation
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js %%v

:: Check pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] pnpm not found, installing...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install pnpm.
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('pnpm --version') do echo [OK] pnpm %%v

:: Check Python 3.11
set "PYTHON_CMD="
where python3.11 >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python3.11"
) else (
    :: On Windows, check if 'python' is 3.11.x
    for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do (
        echo %%v | findstr /b "3.11" >nul
        if !errorlevel! equ 0 (
            set "PYTHON_CMD=python"
        )
    )
)

if not defined PYTHON_CMD (
    echo [ERROR] Python 3.11 is required but not found.
    echo Please install Python 3.11 from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    exit /b 1
)
for /f "tokens=*" %%v in ('%PYTHON_CMD% --version') do echo [OK] %%v

:: ---- Step 1: Install Node.js dependencies ----
echo.
echo [1/4] Installing Node.js dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo [ERROR] pnpm install failed.
    exit /b 1
)
echo [OK] Node.js dependencies installed.

:: ---- Step 2: Install uv (Python package manager) ----
echo.
echo [2/4] Installing uv...
%PYTHON_CMD% -m pip install --quiet uv 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Trying pip install uv...
    pip install --quiet uv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install uv. Please install it manually:
        echo   pip install uv
        exit /b 1
    )
)
echo [OK] uv installed.

:: ---- Step 3: Create Python virtual environment ----
echo.
echo [3/4] Creating Python virtual environment for training sidecar...
cd training-sidecar

if exist .venv (
    echo [INFO] Virtual environment already exists, skipping creation.
) else (
    uv venv --python 3.11 .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        echo Make sure Python 3.11 is available.
        cd ..
        exit /b 1
    )
    echo [OK] Virtual environment created.
)

:: ---- Step 4: Install Python dependencies ----
echo.
echo [4/4] Installing Python dependencies...
uv pip install -r requirements.txt --python .venv\Scripts\python.exe
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    cd ..
    exit /b 1
)
echo [OK] Python dependencies installed.

cd ..

echo.
echo ============================================
echo  Installation complete!
echo ============================================
echo.
echo To start the local server:
echo   pnpm dev
echo.
echo The system will start automatically when
echo you open the training view.
echo.
