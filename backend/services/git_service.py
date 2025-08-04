import git
from git import Repo, GitCommandError
from pathlib import Path
from typing import Optional, List, Tuple
import logging

from models.file_metadata import GitStatus, GitOperation

logger = logging.getLogger(__name__)

class GitService:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.repo: Optional[Repo] = None
        self._initialize_repo()
    
    def _initialize_repo(self):
        """Initialize or load the Git repository."""
        try:
            # Try to load existing repo
            self.repo = Repo(self.repo_path)
            logger.info(f"Loaded existing Git repository at {self.repo_path}")
        except git.InvalidGitRepositoryError:
            # Initialize new repo if none exists
            logger.warning(f"No Git repository found at {self.repo_path}. Please initialize one manually.")
            self.repo = None
        except Exception as e:
            logger.error(f"Error initializing Git repository: {e}")
            self.repo = None
    
    def is_repo_available(self) -> bool:
        """Check if Git repository is available."""
        return self.repo is not None
    
    def get_status(self) -> GitStatus:
        """Get the current Git status."""
        if not self.is_repo_available():
            return GitStatus(
                is_clean=False,
                has_changes=False,
                ahead=0,
                behind=0,
                current_branch="No repository",
                last_commit=None,
                last_commit_message=None
            )
        
        try:
            # Check if working tree is clean
            is_clean = not self.repo.is_dirty(untracked_files=True)
            has_changes = self.repo.is_dirty(untracked_files=True)
            
            # Get current branch
            current_branch = self.repo.active_branch.name
            
            # Get ahead/behind count
            ahead, behind = self._get_ahead_behind_count()
            
            # Get last commit info
            last_commit = None
            last_commit_message = None
            if self.repo.head.is_valid():
                last_commit = self.repo.head.commit.hexsha[:8]
                last_commit_message = self.repo.head.commit.message.strip()
            
            return GitStatus(
                is_clean=is_clean,
                has_changes=has_changes,
                ahead=ahead,
                behind=behind,
                current_branch=current_branch,
                last_commit=last_commit,
                last_commit_message=last_commit_message
            )
            
        except Exception as e:
            logger.error(f"Error getting Git status: {e}")
            return GitStatus(
                is_clean=False,
                has_changes=False,
                ahead=0,
                behind=0,
                current_branch="Error",
                last_commit=None,
                last_commit_message=str(e)
            )
    
    def _get_ahead_behind_count(self) -> Tuple[int, int]:
        """Get the count of commits ahead/behind origin."""
        try:
            # Try to get the remote tracking branch
            tracking_branch = self.repo.active_branch.tracking_branch()
            if tracking_branch is None:
                return 0, 0
            
            # Count commits ahead and behind
            ahead = list(self.repo.iter_commits(f'{tracking_branch}..HEAD'))
            behind = list(self.repo.iter_commits(f'HEAD..{tracking_branch}'))
            
            return len(ahead), len(behind)
            
        except Exception:
            return 0, 0
    
    def add_and_commit(self, message: str, files_pattern: str = "files/") -> GitOperation:
        """Add files and commit changes."""
        if not self.is_repo_available():
            return GitOperation(
                success=False,
                message="Git repository not available",
                details="Please initialize a Git repository first"
            )
        
        try:
            # Add files
            self.repo.git.add(files_pattern)
            
            # Check if there are changes to commit
            if not self.repo.is_dirty(untracked_files=True):
                return GitOperation(
                    success=True,
                    message="No changes to commit",
                    details="Working tree is clean"
                )
            
            # Commit changes
            commit = self.repo.index.commit(message)
            
            return GitOperation(
                success=True,
                message="Successfully committed changes",
                details=f"Commit {commit.hexsha[:8]}: {message}"
            )
            
        except Exception as e:
            logger.error(f"Error committing changes: {e}")
            return GitOperation(
                success=False,
                message="Failed to commit changes",
                details=str(e)
            )
    
    def push(self, remote: str = "origin", branch: Optional[str] = None) -> GitOperation:
        """Push changes to remote repository."""
        if not self.is_repo_available():
            return GitOperation(
                success=False,
                message="Git repository not available",
                details="Please initialize a Git repository first"
            )
        
        try:
            # Use current branch if none specified
            if branch is None:
                branch = self.repo.active_branch.name
            
            # Get the remote
            origin = self.repo.remote(remote)
            
            # Set environment to avoid interactive prompts
            import os
            env = os.environ.copy()
            env['GIT_TERMINAL_PROMPT'] = '0'  # Disable terminal prompts
            env['GIT_ASKPASS'] = 'echo'       # Disable password prompts
            
            # Push to remote with timeout and no prompts
            push_info = origin.push(branch, env=env)
            
            # Check if push was successful
            if push_info and push_info[0].flags & push_info[0].ERROR:
                error_details = str(push_info[0].summary)
                
                # Check for authentication errors
                if "authentication" in error_details.lower() or "permission denied" in error_details.lower():
                    return GitOperation(
                        success=False,
                        message="Authentication failed",
                        details="Please set up SSH keys or Personal Access Token. See README for setup instructions."
                    )
                
                return GitOperation(
                    success=False,
                    message="Push failed",
                    details=error_details
                )
            
            return GitOperation(
                success=True,
                message="Successfully pushed changes",
                details=f"Pushed to {remote}/{branch}"
            )
            
        except GitCommandError as e:
            error_msg = str(e)
            
            # Handle specific authentication errors
            if "authentication failed" in error_msg.lower() or "permission denied" in error_msg.lower():
                return GitOperation(
                    success=False,
                    message="Authentication failed",
                    details="Please set up SSH keys or Personal Access Token. Check your Git credentials configuration."
                )
            elif "remote rejected" in error_msg.lower():
                return GitOperation(
                    success=False,
                    message="Push rejected by remote",
                    details="The remote repository rejected the push. You may need to pull first or check branch permissions."
                )
            else:
                return GitOperation(
                    success=False,
                    message="Push failed",
                    details=error_msg
                )
                
        except Exception as e:
            logger.error(f"Error pushing changes: {e}")
            error_msg = str(e)
            
            if "authentication" in error_msg.lower() or "credential" in error_msg.lower():
                return GitOperation(
                    success=False,
                    message="Authentication required",
                    details="Please configure Git authentication (SSH keys or Personal Access Token)"
                )
            
            return GitOperation(
                success=False,
                message="Failed to push changes",
                details=error_msg
            )
    
    def pull(self, remote: str = "origin", branch: Optional[str] = None) -> GitOperation:
        """Pull changes from remote repository."""
        if not self.is_repo_available():
            return GitOperation(
                success=False,
                message="Git repository not available",
                details="Please initialize a Git repository first"
            )
        
        try:
            # Use current branch if none specified
            if branch is None:
                branch = self.repo.active_branch.name
            
            # Get the remote
            origin = self.repo.remote(remote)
            
            # Set environment to avoid interactive prompts
            import os
            env = os.environ.copy()
            env['GIT_TERMINAL_PROMPT'] = '0'  # Disable terminal prompts
            env['GIT_ASKPASS'] = 'echo'       # Disable password prompts
            
            # Pull from remote with no prompts
            pull_info = origin.pull(branch, env=env)
            
            if pull_info:
                info = pull_info[0]
                return GitOperation(
                    success=True,
                    message="Successfully pulled changes",
                    details=f"Pulled from {remote}/{branch}: {info.note}"
                )
            else:
                return GitOperation(
                    success=True,
                    message="Already up to date",
                    details="No changes to pull"
                )
            
        except GitCommandError as e:
            error_msg = str(e)
            
            # Handle merge conflicts or other Git errors
            logger.error(f"Git command error during pull: {e}")
            if "conflict" in error_msg.lower():
                return GitOperation(
                    success=False,
                    message="Merge conflict detected",
                    details="Please resolve conflicts manually and try again"
                )
            elif "authentication failed" in error_msg.lower() or "permission denied" in error_msg.lower():
                return GitOperation(
                    success=False,
                    message="Authentication failed",
                    details="Please set up SSH keys or Personal Access Token. Check your Git credentials configuration."
                )
            else:
                return GitOperation(
                    success=False,
                    message="Failed to pull changes",
                    details=error_msg
                )
        except Exception as e:
            logger.error(f"Error pulling changes: {e}")
            error_msg = str(e)
            
            if "authentication" in error_msg.lower() or "credential" in error_msg.lower():
                return GitOperation(
                    success=False,
                    message="Authentication required",
                    details="Please configure Git authentication (SSH keys or Personal Access Token)"
                )
            
            return GitOperation(
                success=False,
                message="Failed to pull changes",
                details=error_msg
            )
    
    def commit_and_push(self, message: str, files_pattern: str = "files/") -> GitOperation:
        """Convenience method to add, commit, and push in one operation."""
        # First commit
        commit_result = self.add_and_commit(message, files_pattern)
        if not commit_result.success:
            return commit_result
        
        # If there were no changes, just return success
        if "No changes to commit" in commit_result.message:
            return commit_result
        
        # Then push
        push_result = self.push()
        if not push_result.success:
            return GitOperation(
                success=False,
                message="Commit successful but push failed",
                details=f"Commit: {commit_result.details}. Push error: {push_result.details}"
            )
        
        return GitOperation(
            success=True,
            message="Successfully committed and pushed changes",
            details=f"{commit_result.details}. {push_result.details}"
        )
    
    def get_recent_commits(self, count: int = 10) -> List[dict]:
        """Get recent commits."""
        if not self.is_repo_available():
            return []
        
        try:
            commits = []
            for commit in self.repo.iter_commits(max_count=count):
                commits.append({
                    "hash": commit.hexsha[:8],
                    "message": commit.message.strip(),
                    "author": str(commit.author),
                    "date": commit.committed_datetime.isoformat(),
                    "files_changed": len(commit.stats.files)
                })
            return commits
        except Exception as e:
            logger.error(f"Error getting recent commits: {e}")
            return []
