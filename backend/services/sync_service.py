import asyncio
import logging
from typing import Optional
from datetime import datetime, timedelta

from services.git_service import GitService
from models.config import SyncConfig

logger = logging.getLogger(__name__)

class SyncService:
    def __init__(self, git_service: GitService, config: SyncConfig):
        self.git_service = git_service
        self.config = config
        self.last_pull_time: Optional[datetime] = None
        self._sync_task: Optional[asyncio.Task] = None
        self.is_running = False
    
    async def start_auto_sync(self):
        """Start the automatic sync process."""
        if self.is_running:
            logger.warning("Auto-sync is already running")
            return
        
        self.is_running = True
        logger.info(f"Starting auto-sync with interval: {self.config.auto_pull_interval} seconds")
        
        # Pull on startup if configured
        if self.config.auto_pull_on_startup:
            await self.perform_pull()
        
        # Start the periodic sync task
        self._sync_task = asyncio.create_task(self._sync_loop())
    
    async def stop_auto_sync(self):
        """Stop the automatic sync process."""
        if not self.is_running:
            return
        
        self.is_running = False
        logger.info("Stopping auto-sync")
        
        if self._sync_task:
            self._sync_task.cancel()
            try:
                await self._sync_task
            except asyncio.CancelledError:
                pass
    
    async def _sync_loop(self):
        """Main sync loop that runs periodically."""
        try:
            while self.is_running:
                await asyncio.sleep(self.config.auto_pull_interval)
                
                if self.is_running:  # Check again in case it was stopped during sleep
                    await self.perform_pull()
        except asyncio.CancelledError:
            logger.info("Sync loop cancelled")
        except Exception as e:
            logger.error(f"Error in sync loop: {e}")
    
    async def perform_pull(self) -> bool:
        """Perform a git pull operation."""
        try:
            logger.info("Performing automatic pull...")
            
            # Check if repository is available
            if not self.git_service.is_repo_available():
                logger.warning("Git repository not available for auto-sync")
                return False
            
            # Perform the pull
            result = self.git_service.pull()
            self.last_pull_time = datetime.now()
            
            if result.success:
                logger.info(f"Auto-pull successful: {result.message}")
                return True
            else:
                logger.warning(f"Auto-pull failed: {result.message}")
                return False
                
        except Exception as e:
            logger.error(f"Error during auto-pull: {e}")
            return False
    
    def get_sync_status(self) -> dict:
        """Get the current sync status."""
        return {
            "is_running": self.is_running,
            "last_pull_time": self.last_pull_time.isoformat() if self.last_pull_time else None,
            "auto_pull_interval": self.config.auto_pull_interval,
            "auto_pull_on_startup": self.config.auto_pull_on_startup
        }
    
    def should_auto_pull(self) -> bool:
        """Check if it's time for an automatic pull."""
        if not self.last_pull_time:
            return True
        
        time_since_last_pull = datetime.now() - self.last_pull_time
        return time_since_last_pull >= timedelta(seconds=self.config.auto_pull_interval)
