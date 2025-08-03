# GitHub Sync System Setup Script for Windows
# Run this script in PowerShell to set up the entire system

Write-Host "🚀 GitHub Sync System Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "backend\main.py") -or !(Test-Path "frontend\package.json")) {
    Write-Host "❌ Error: Please run this script from the sync_service root directory" -ForegroundColor Red
    exit 1
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.12+ and add it to PATH" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Found Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ and add it to PATH" -ForegroundColor Red
    exit 1
}

# Check Git
try {
    $gitVersion = git --version 2>&1
    Write-Host "✅ Found Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git and add it to PATH" -ForegroundColor Red
    exit 1
}

# Create files directory if it doesn't exist
if (!(Test-Path "files")) {
    New-Item -ItemType Directory -Name "files" | Out-Null
    Write-Host "✅ Created files directory" -ForegroundColor Green
} else {
    Write-Host "✅ Files directory already exists" -ForegroundColor Green
}

# Setup backend
Write-Host "`n🐍 Setting up backend..." -ForegroundColor Yellow
Set-Location backend

try {
    Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
    pip install -e . 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} catch {
    Write-Host "❌ Error installing backend dependencies: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Setup frontend
Write-Host "`n⚛️ Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend

try {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} catch {
    Write-Host "❌ Error installing frontend dependencies: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Git setup check
Write-Host "`n📦 Checking Git repository..." -ForegroundColor Yellow

if (Test-Path ".git") {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
    
    # Check if remote origin exists
    $remoteOrigin = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Remote origin configured: $remoteOrigin" -ForegroundColor Green
        
        # Check authentication
        Write-Host "`n🔐 Checking GitHub authentication..." -ForegroundColor Yellow
        
        if ($remoteOrigin -like "*github.com*") {
            if ($remoteOrigin -like "git@github.com*") {
                # SSH authentication
                Write-Host "🔑 Using SSH authentication" -ForegroundColor Cyan
                $sshTest = ssh -T git@github.com 2>&1
                if ($sshTest -like "*successfully authenticated*") {
                    Write-Host "✅ SSH authentication working" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ SSH authentication may not be configured" -ForegroundColor Yellow
                    Write-Host "Run 'ssh -T git@github.com' to test SSH access" -ForegroundColor Cyan
                }
            } else {
                # HTTPS authentication
                Write-Host "🔑 Using HTTPS authentication" -ForegroundColor Cyan
                Write-Host "⚠️ Make sure you have a Personal Access Token configured" -ForegroundColor Yellow
                Write-Host "Test with: git ls-remote origin" -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host "⚠️ No remote origin configured" -ForegroundColor Yellow
        Write-Host "`n🚨 IMPORTANT: You need to set up authentication!" -ForegroundColor Red
        Write-Host "Choose one option:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Option A - SSH (Recommended):" -ForegroundColor White
        Write-Host "1. ssh-keygen -t ed25519 -C `"your_email@example.com`"" -ForegroundColor Gray
        Write-Host "2. Add the public key to GitHub (Settings > SSH keys)" -ForegroundColor Gray
        Write-Host "3. git remote add origin git@github.com:yourusername/your-repo.git" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option B - Personal Access Token:" -ForegroundColor White
        Write-Host "1. Create token at GitHub Settings > Developer settings > Personal access tokens" -ForegroundColor Gray
        Write-Host "2. git remote add origin https://github.com/yourusername/your-repo.git" -ForegroundColor Gray
        Write-Host "3. Use username + token when prompted" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option C - GitHub CLI:" -ForegroundColor White
        Write-Host "1. Install GitHub CLI" -ForegroundColor Gray
        Write-Host "2. gh auth login" -ForegroundColor Gray
        Write-Host "3. git remote add origin https://github.com/yourusername/your-repo.git" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ Git repository not initialized" -ForegroundColor Yellow
    Write-Host "`n🚨 IMPORTANT: Set up Git repository and authentication!" -ForegroundColor Red
    Write-Host "Follow these steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Initialize repository:" -ForegroundColor White
    Write-Host "   git init" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Set up authentication (choose one):" -ForegroundColor White
    Write-Host ""
    Write-Host "   Option A - SSH:" -ForegroundColor Cyan
    Write-Host "   ssh-keygen -t ed25519 -C `"your_email@example.com`"" -ForegroundColor Gray
    Write-Host "   # Add public key to GitHub" -ForegroundColor Gray
    Write-Host "   git remote add origin git@github.com:yourusername/your-repo.git" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option B - Token:" -ForegroundColor Cyan
    Write-Host "   # Create Personal Access Token on GitHub" -ForegroundColor Gray
    Write-Host "   git remote add origin https://github.com/yourusername/your-repo.git" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Initial commit:" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m `"Initial commit`"" -ForegroundColor Gray
    Write-Host "   git branch -M main" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor Gray
}

# Create start scripts
Write-Host "`n📝 Creating start scripts..." -ForegroundColor Yellow

# Backend start script
@"
@echo off
echo Starting GitHub Sync Backend...
cd backend
python main.py
pause
"@ | Out-File -FilePath "start-backend.bat" -Encoding ASCII

# Frontend start script
@"
@echo off
echo Starting GitHub Sync Frontend...
cd frontend
npm run dev
pause
"@ | Out-File -FilePath "start-frontend.bat" -Encoding ASCII

# Both start script
@"
@echo off
echo Starting GitHub Sync System...
echo.
echo Starting backend in new window...
start "GitHub Sync Backend" cmd /k "cd backend && python main.py"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend...
cd frontend
npm run dev
pause
"@ | Out-File -FilePath "start-both.bat" -Encoding ASCII

Write-Host "✅ Created start-backend.bat" -ForegroundColor Green
Write-Host "✅ Created start-frontend.bat" -ForegroundColor Green
Write-Host "✅ Created start-both.bat" -ForegroundColor Green

# Success message
Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up your Git repository (if not done already)" -ForegroundColor White
Write-Host "2. Run start-both.bat to start both backend and frontend" -ForegroundColor White
Write-Host "3. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "4. Upload some files and test the sync functionality" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URLs:" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see README.md" -ForegroundColor Yellow

Write-Host "`nPress any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
