# GitHub Sync System

A system that syncs files across multiple PCs using GitHub as the central repository. Features a React frontend and FastAPI backend with automatic Git operations.

## 🏗️ Architecture

```
[React + Vite Frontend] ⇄ [FastAPI Backend] ⇄ [Local Git Repo] ⇄ [GitHub Repository]
```

## 📁 Project Structure

```
sync_service/
├── backend/                # FastAPI backend
│   ├── main.py            # Main application
│   ├── services/          # Business logic
│   ├── models/            # Pydantic models
│   ├── utils/             # Utility functions
│   └── pyproject.toml     # Python dependencies
├── frontend/              # React + Vite frontend
│   ├── src/               # Source code
│   ├── components/        # React components
│   └── package.json       # Node dependencies
├── files/                 # Synced files directory
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- Git
- A GitHub repository (public or private)

### 1. Initial Setup

1. **Clone or initialize your project as a Git repository:**

   ```bash
   cd sync_service
   git init
   git remote add origin https://github.com/yourusername/your-repo.git
   ```

2. **Create the synced files directory:**

   ```bash
   mkdir files
   ```

3. **Set up GitHub authentication (IMPORTANT!):**

   **⚠️ This step is critical for the system to work!**

   The backend needs to authenticate with GitHub to push/pull changes automatically. Without this, operations will fail.

   **Quick setup options:**

   **Option A: SSH Keys (Recommended)**

   ```bash
   # Generate SSH key
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Add public key to GitHub Settings > SSH and GPG keys
   # Use SSH URL for remote
   git remote set-url origin git@github.com:yourusername/your-repo.git
   ```

   **Option B: Personal Access Token**

   ```bash
   # Create token at GitHub Settings > Developer settings > Personal access tokens
   # Give it 'repo' permissions
   git config --global credential.helper store
   # Use HTTPS URL - will prompt for username and token
   git remote set-url origin https://github.com/yourusername/your-repo.git
   ```

   **Option C: GitHub CLI**

   ```bash
   gh auth login  # Follow prompts
   ```

   **📖 For detailed setup instructions, see [AUTHENTICATION.md](AUTHENTICATION.md)**

### 2. Backend Setup

1. **Install Python dependencies:**

   ```bash
   cd backend
   pip install -e .
   ```

2. **Start the backend server:**

   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`

### 3. Frontend Setup

1. **Install Node.js dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### 4. First Use

1. Open the frontend in your browser
2. Upload some files using the upload interface
3. Click "Commit & Push" to sync to GitHub
4. On another PC, clone the repo and follow the same setup steps
5. Click "Pull" to get the files

## 🔧 Configuration

### Backend Configuration

The backend uses these default settings (configurable in `backend/models/config.py`):

```python
auto_pull_interval: 600        # 10 minutes
auto_pull_on_startup: True     # Pull on startup
files_directory: "files"       # Synced files folder
max_file_size: 10MB           # Maximum upload size
```

### Frontend Configuration

The frontend connects to the backend at `http://localhost:8000` by default. This can be changed in `frontend/src/services/api.ts`.

## 📖 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

### Key Endpoints

| Endpoint           | Method | Description             |
| ------------------ | ------ | ----------------------- |
| `/files`           | GET    | List files and folders  |
| `/files/{path}`    | GET    | Get file content        |
| `/upload`          | POST   | Upload files            |
| `/git/status`      | GET    | Git repository status   |
| `/git/commit-push` | POST   | Commit and push changes |
| `/git/pull`        | POST   | Pull from remote        |

## 🔄 Workflow

### Single User, Multiple PCs

1. **PC A**: Upload files → Commit & Push
2. **PC B**: Pull changes → View/edit files
3. **PC B**: Make changes → Commit & Push
4. **PC A**: Pull changes → Continue working

### Features

- **File Management**: Upload, view, and organize files
- **Syntax Highlighting**: Code viewer with language detection
- **Git Integration**: Automatic commit, push, and pull operations
- **Auto-sync**: Optional automatic pulling of changes
- **Conflict Handling**: Basic conflict detection and resolution

## 🛠️ Development

### Backend Development

```bash
cd backend
pip install -e .
python main.py
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
pip install -e .
python main.py
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend not available**

   - Check if Python server is running on port 8000
   - Verify all dependencies are installed

2. **Git operations failing**

   - Ensure you have a Git repository initialized
   - Check if you have the correct remote origin set
   - Verify Git credentials are configured

3. **Authentication errors when pushing/pulling**

   **Error: "Authentication failed" or "Permission denied"**

   This means Git can't authenticate with GitHub. Choose one solution:

   **Solution A: Set up SSH keys**

   ```bash
   # Generate SSH key
   ssh-keygen -t ed25519 -C "your_email@example.com"

   # Add to SSH agent
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519

   # Copy public key to GitHub
   cat ~/.ssh/id_ed25519.pub
   # Add this to GitHub Settings > SSH and GPG keys

   # Update remote URL to use SSH
   git remote set-url origin git@github.com:yourusername/your-repo.git

   # Test connection
   ssh -T git@github.com
   ```

   **Solution B: Use Personal Access Token**

   ```bash
   # Create token at GitHub Settings > Developer settings > Personal access tokens
   # Give it 'repo' permissions

   # Configure credential helper
   git config --global credential.helper store

   # Update remote URL to use HTTPS
   git remote set-url origin https://github.com/yourusername/your-repo.git

   # Next push/pull will prompt for credentials
   # Use your username and token (not password)
   ```

   **Solution C: Use GitHub CLI**

   ```bash
   # Install GitHub CLI and authenticate
   gh auth login
   ```

4. **File upload issues**

   - Check file size limits (10MB default)
   - Ensure the `files/` directory exists

5. **Auto-sync not working**

   - Verify Git repository is properly configured
   - Check backend logs for error messages
   - Ensure authentication is set up correctly

6. **"remote rejected" errors**
   - The remote repository rejected the push
   - Try pulling first: click "Pull" button before "Commit & Push"
   - Check if you have write permissions to the repository

### Authentication Verification

To verify your authentication is working:

```bash
# For SSH
ssh -T git@github.com

# For HTTPS
git ls-remote origin

# Test push (make a small change first)
echo "test" > test.txt
git add test.txt
git commit -m "test"
git push
```

### Logs

Backend logs are displayed in the console where you started the Python server.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the backend logs
3. Ensure all prerequisites are installed
4. Verify your Git repository is properly configured
