import shutil
from pathlib import Path
from typing import List
from datetime import datetime

from models.file_metadata import FileItem, FileContent
from utils.path_utils import get_safe_path, get_file_language, is_binary_file

class FileManager:
    def __init__(self, files_directory: str = "files"):
        self.base_path = Path.cwd() / files_directory
        self.base_path.mkdir(exist_ok=True)
    
    def list_files(self, relative_path: str = "") -> List[FileItem]:
        """List files and directories in the given path."""
        try:
            target_path = get_safe_path(self.base_path, relative_path)
            if not target_path.exists():
                return []
            
            items = []
            for item in target_path.iterdir():
                if item.name.startswith('.'):
                    continue  # Skip hidden files
                
                file_item = FileItem(
                    name=item.name,
                    path=str(item.relative_to(self.base_path)).replace('\\', '/'),
                    is_directory=item.is_dir(),
                    size=item.stat().st_size if item.is_file() else None,
                    modified=datetime.fromtimestamp(item.stat().st_mtime),
                    extension=item.suffix.lower() if item.is_file() else None,
                    language=get_file_language(item.name) if item.is_file() else None
                )
                items.append(file_item)
            
            # Sort: directories first, then files, both alphabetically
            items.sort(key=lambda x: (not x.is_directory, x.name.lower()))
            return items
            
        except Exception as e:
            raise ValueError(f"Error listing files: {str(e)}")
    
    def get_file_content(self, relative_path: str) -> FileContent:
        """Get the content of a file."""
        try:
            file_path = get_safe_path(self.base_path, relative_path)
            
            if not file_path.exists() or not file_path.is_file():
                raise FileNotFoundError(f"File not found: {relative_path}")
            
            if is_binary_file(file_path):
                raise ValueError("Cannot display binary file content")
            
            # Check file size (limit to 1MB for display)
            if file_path.stat().st_size > 1024 * 1024:
                raise ValueError("File too large to display (max 1MB)")
            
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            return FileContent(
                content=content,
                language=get_file_language(file_path.name),
                path=relative_path,
                size=file_path.stat().st_size,
                modified=datetime.fromtimestamp(file_path.stat().st_mtime)
            )
            
        except Exception as e:
            raise ValueError(f"Error reading file: {str(e)}")
    
    def save_file(self, relative_path: str, content: bytes) -> str:
        """Save a file to the files directory."""
        try:
            file_path = get_safe_path(self.base_path, relative_path)
            
            # Create parent directories if they don't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'wb') as f:
                f.write(content)
            
            return str(file_path.relative_to(self.base_path)).replace('\\', '/')
            
        except Exception as e:
            raise ValueError(f"Error saving file: {str(e)}")
    
    def save_directory(self, relative_path: str) -> str:
        """Create a directory in the files directory."""
        try:
            dir_path = get_safe_path(self.base_path, relative_path)
            dir_path.mkdir(parents=True, exist_ok=True)
            
            return str(dir_path.relative_to(self.base_path)).replace('\\', '/')
            
        except Exception as e:
            raise ValueError(f"Error creating directory: {str(e)}")
    
    def delete_file_or_directory(self, relative_path: str) -> bool:
        """Delete a file or directory."""
        try:
            target_path = get_safe_path(self.base_path, relative_path)
            
            if not target_path.exists():
                return False
            
            if target_path.is_file():
                target_path.unlink()
            else:
                shutil.rmtree(target_path)
            
            return True
            
        except Exception as e:
            raise ValueError(f"Error deleting: {str(e)}")
    
    def get_all_files_recursive(self) -> List[str]:
        """Get a list of all files in the files directory recursively."""
        files = []
        for file_path in self.base_path.rglob('*'):
            if file_path.is_file() and not file_path.name.startswith('.'):
                relative_path = str(file_path.relative_to(self.base_path)).replace('\\', '/')
                files.append(relative_path)
        return files
