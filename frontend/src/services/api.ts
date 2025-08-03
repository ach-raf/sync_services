import axios from "axios";
import type {
  FileItem,
  FileContent,
  GitStatus,
  GitOperation,
  CommitRequest,
  UploadResponse,
  SyncStatus,
  HealthStatus,
  Commit,
} from "../types/api";

const API_BASE_URL = "http://localhost:45553";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export class ApiService {
  // File operations
  static async listFiles(
    path: string = ""
  ): Promise<{ files: FileItem[]; path: string }> {
    const response = await api.get("/files", { params: { path } });
    return response.data;
  }

  static async getFileContent(filePath: string): Promise<FileContent> {
    const response = await api.get(`/files/${encodeURIComponent(filePath)}`);
    return response.data;
  }

  static async uploadFiles(
    files: File[],
    path: string = ""
  ): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("path", path);

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  // Git operations
  static async getGitStatus(): Promise<GitStatus> {
    const response = await api.get("/git/status");
    return response.data;
  }

  static async commitAndPush(message?: string): Promise<GitOperation> {
    const requestData: CommitRequest = {};
    if (message) {
      requestData.message = message;
    }
    const response = await api.post("/git/commit-push", requestData);
    return response.data;
  }

  static async pullChanges(): Promise<GitOperation> {
    const response = await api.post("/git/pull");
    return response.data;
  }

  static async getRecentCommits(
    count: number = 10
  ): Promise<{ commits: Commit[] }> {
    const response = await api.get("/git/commits", { params: { count } });
    return response.data;
  }

  // Sync operations
  static async getSyncStatus(): Promise<SyncStatus> {
    const response = await api.get("/sync/status");
    return response.data;
  }

  static async manualSyncPull(): Promise<GitOperation> {
    const response = await api.post("/sync/manual-pull");
    return response.data;
  }

  // Health check
  static async getHealthStatus(): Promise<HealthStatus> {
    const response = await api.get("/health");
    return response.data;
  }

  // Utility method to check if backend is available
  static async isBackendAvailable(): Promise<boolean> {
    try {
      await api.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      return (
        error.response.data?.detail ||
        error.response.data?.message ||
        "Server error"
      );
    } else if (error.request) {
      // Request was made but no response
      return "Backend server is not available. Please make sure it is running.";
    } else {
      // Something else happened
      return error.message || "Request failed";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};
