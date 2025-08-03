from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FileItem(BaseModel):
    name: str
    path: str
    is_directory: bool
    size: Optional[int] = None
    modified: Optional[datetime] = None
    extension: Optional[str] = None
    language: Optional[str] = None

class FileContent(BaseModel):
    content: str
    language: str
    path: str
    size: int
    modified: datetime

class GitStatus(BaseModel):
    is_clean: bool
    has_changes: bool
    ahead: int
    behind: int
    current_branch: str
    last_commit: Optional[str] = None
    last_commit_message: Optional[str] = None

class GitOperation(BaseModel):
    success: bool
    message: str
    details: Optional[str] = None

class CommitRequest(BaseModel):
    message: Optional[str] = "Updated files via web UI"

class UploadResponse(BaseModel):
    success: bool
    message: str
    uploaded_files: List[str]
