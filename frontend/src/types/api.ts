// API Types matching the backend models

export interface FileItem {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
  modified?: string;
  extension?: string;
  language?: string;
}

export interface FileContent {
  content: string;
  language: string;
  path: string;
  size: number;
  modified: string;
}

export interface GitStatus {
  is_clean: boolean;
  has_changes: boolean;
  ahead: number;
  behind: number;
  current_branch: string;
  last_commit?: string;
  last_commit_message?: string;
}

export interface GitOperation {
  success: boolean;
  message: string;
  details?: string;
}

export interface CommitRequest {
  message?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  uploaded_files: string[];
}

export interface SyncStatus {
  is_running: boolean;
  last_pull_time?: string;
  auto_pull_interval: number;
  auto_pull_on_startup: boolean;
}

export interface HealthStatus {
  status: string;
  git_available: boolean;
  sync_running: boolean;
  files_directory: string;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files_changed: number;
}
