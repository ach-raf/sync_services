from pydantic import BaseModel

class SyncConfig(BaseModel):
    auto_pull_interval: int = 600  # 10 minutes
    auto_pull_on_startup: bool = True
    default_commit_message: str = "Updated files via web UI"
    files_directory: str = "files"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
