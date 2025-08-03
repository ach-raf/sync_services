import re
import math
from pathlib import Path

def sanitize_path(path: str) -> str:
    """Sanitize and normalize a file path."""
    # Remove any dangerous characters
    path = re.sub(r'[<>:"|?*]', '', path)
    # Remove leading/trailing whitespace and dots
    path = path.strip(' .')
    # Normalize path separators
    path = path.replace('\\', '/')
    # Remove any attempts to navigate up directories
    path = re.sub(r'\.\./', '', path)
    path = re.sub(r'^\.\.', '', path)
    return path

def get_safe_path(base_path: Path, relative_path: str) -> Path:
    """Get a safe path within the base directory."""
    sanitized = sanitize_path(relative_path)
    full_path = base_path / sanitized
    
    # Ensure the path is within the base directory
    try:
        full_path.resolve().relative_to(base_path.resolve())
        return full_path
    except ValueError:
        raise ValueError(f"Path '{relative_path}' is not within the allowed directory")

def get_file_language(file_path: str) -> str:
    """Determine the programming language based on file extension."""
    extension = Path(file_path).suffix.lower()
    
    language_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.json': 'json',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.md': 'markdown',
        '.txt': 'text',
        '.sh': 'bash',
        '.bat': 'batch',
        '.ps1': 'powershell',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.sql': 'sql',
        '.r': 'r',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.dart': 'dart',
        '.vue': 'vue',
        '.svelte': 'svelte'
    }
    
    return language_map.get(extension, 'text')

def is_binary_file(file_path: Path) -> bool:
    """Check if a file is binary."""
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(512)
            return b'\x00' in chunk
    except Exception:
        return False

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format."""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"
