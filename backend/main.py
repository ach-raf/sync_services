import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
import uvicorn

from services.file_manager import FileManager
from services.git_service import GitService
from services.sync_service import SyncService
from models.file_metadata import GitStatus, GitOperation, CommitRequest, UploadResponse
from models.config import SyncConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
config = SyncConfig()
file_manager = FileManager(config.files_directory)
git_service = GitService("..")  # Look for Git repo in parent directory
sync_service = SyncService(git_service, config)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info("Starting GitHub Sync System Backend...")
    
    # Start auto-sync if repository is available
    if git_service.is_repo_available():
        await sync_service.start_auto_sync()
        logger.info("Auto-sync started")
    else:
        logger.warning("Git repository not available - auto-sync disabled")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await sync_service.stop_auto_sync()

app = FastAPI(
    title="GitHub Sync System",
    description="Backend API for syncing files across PCs via GitHub",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:45554", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "GitHub Sync System Backend",
        "version": "1.0.0",
        "endpoints": {
            "files": "/files",
            "git_status": "/git/status",
            "upload": "/upload",
            "commit_push": "/git/commit-push",
            "pull": "/git/pull"
        }
    }

@app.get("/files")
async def list_files(path: str = ""):
    """List files and directories in the files folder."""
    try:
        files = file_manager.list_files(path)
        return {"files": files, "path": path}
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files/{file_path:path}")
async def get_file_content(file_path: str):
    """Get the content of a specific file."""
    try:
        content = file_manager.get_file_content(file_path)
        return content
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.error(f"Error getting file content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload", response_model=UploadResponse)
async def upload_files(
    files: List[UploadFile] = File(...),
    path: str = Form("")
):
    """Upload one or more files to the files directory."""
    try:
        uploaded_files = []
        
        for file in files:
            if not file.filename:
                continue
            
            # Determine the file path
            if path:
                file_path = f"{path.strip('/')}/{file.filename}"
            else:
                file_path = file.filename
            
            # Read file content
            content = await file.read()
            
            # Check file size
            if len(content) > config.max_file_size:
                raise HTTPException(
                    status_code=413,
                    detail=f"File {file.filename} is too large (max {config.max_file_size} bytes)"
                )
            
            # Save the file
            saved_path = file_manager.save_file(file_path, content)
            uploaded_files.append(saved_path)
        
        return UploadResponse(
            success=True,
            message=f"Successfully uploaded {len(uploaded_files)} file(s)",
            uploaded_files=uploaded_files
        )
        
    except Exception as e:
        logger.error(f"Error uploading files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/git/status", response_model=GitStatus)
async def get_git_status():
    """Get the current Git status."""
    try:
        status = git_service.get_status()
        return status
    except Exception as e:
        logger.error(f"Error getting Git status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/git/commit-push", response_model=GitOperation)
async def commit_and_push(request: CommitRequest):
    """Commit and push changes to the remote repository."""
    try:
        message = request.message or config.default_commit_message
        result = git_service.commit_and_push(message)
        return result
    except Exception as e:
        logger.error(f"Error committing and pushing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/git/pull", response_model=GitOperation)
async def pull_changes():
    """Pull changes from the remote repository."""
    try:
        result = git_service.pull()
        return result
    except Exception as e:
        logger.error(f"Error pulling changes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/git/commits")
async def get_recent_commits(count: int = 10):
    """Get recent commits."""
    try:
        commits = git_service.get_recent_commits(count)
        return {"commits": commits}
    except Exception as e:
        logger.error(f"Error getting recent commits: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sync/status")
async def get_sync_status():
    """Get the current sync service status."""
    try:
        status = sync_service.get_sync_status()
        return status
    except Exception as e:
        logger.error(f"Error getting sync status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync/manual-pull", response_model=GitOperation)
async def manual_sync_pull():
    """Manually trigger a sync pull."""
    try:
        success = await sync_service.perform_pull()
        if success:
            return GitOperation(
                success=True,
                message="Manual sync pull completed successfully",
                details="Files have been synchronized"
            )
        else:
            return GitOperation(
                success=False,
                message="Manual sync pull failed",
                details="Check logs for more information"
            )
    except Exception as e:
        logger.error(f"Error during manual sync pull: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "git_available": git_service.is_repo_available(),
        "sync_running": sync_service.is_running,
        "files_directory": str(file_manager.base_path)
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=45553,
        reload=True,
        log_level="info"
    )
