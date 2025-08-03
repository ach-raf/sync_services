import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Folder, Upload as UploadIcon, RefreshCw } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import FileTree from "./components/FileTree";
import CodeViewer from "./components/CodeViewer";
import FileUpload from "./components/FileUpload";
import GitStatusPanel from "./components/GitStatusPanel";
import { ApiService, handleApiError } from "./services/api";
import type { FileItem, FileContent, GitStatus, SyncStatus } from "./types/api";

function App() {
  // State management
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Loading states
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [commitPushLoading, setCommitPushLoading] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);

  // UI state
  const [showUpload, setShowUpload] = useState(false);
  const [fileContentError, setFileContentError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Load files from API
  const loadFiles = async (path: string = "") => {
    setFilesLoading(true);
    try {
      const response = await ApiService.listFiles(path);
      setFiles(response.files);
      setCurrentPath(response.path);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(`Failed to load files: ${errorMessage}`);
      setBackendAvailable(false);
    } finally {
      setFilesLoading(false);
    }
  };

  // Load file content
  const loadFileContent = async (file: FileItem) => {
    if (file.is_directory) return;

    setFileContentLoading(true);
    setFileContentError(null);

    try {
      const content = await ApiService.getFileContent(file.path);
      setFileContent(content);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setFileContentError(errorMessage);
      setFileContent(null);
    } finally {
      setFileContentLoading(false);
    }
  };

  // Load Git and sync status
  const loadStatus = async () => {
    setStatusLoading(true);
    try {
      const [gitStatusResponse, syncStatusResponse] = await Promise.all([
        ApiService.getGitStatus(),
        ApiService.getSyncStatus(),
      ]);
      setGitStatus(gitStatusResponse);
      setSyncStatus(syncStatusResponse);
      setBackendAvailable(true);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(`Failed to load status: ${errorMessage}`);
      setBackendAvailable(false);
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    loadFileContent(file);
  };

  // Handle folder navigation
  const handleFolderNavigate = (path: string) => {
    setSelectedFile(null);
    setFileContent(null);
    setFileContentError(null);
    loadFiles(path);
  };

  // Handle upload completion
  const handleUploadComplete = (success: boolean, message: string) => {
    if (success) {
      toast.success(message);
      loadFiles(currentPath); // Refresh file list
      loadStatus(); // Refresh Git status
    } else {
      toast.error(message);
    }
    setShowUpload(false);
  };

  // Handle commit and push
  const handleCommitPush = async () => {
    setCommitPushLoading(true);
    try {
      const result = await ApiService.commitAndPush();
      if (result.success) {
        toast.success(result.message);
        loadStatus(); // Refresh status
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(`Commit failed: ${errorMessage}`);
    } finally {
      setCommitPushLoading(false);
    }
  };

  // Handle pull
  const handlePull = async () => {
    setPullLoading(true);
    try {
      const result = await ApiService.pullChanges();
      if (result.success) {
        toast.success(result.message);
        loadFiles(currentPath); // Refresh file list
        loadStatus(); // Refresh status
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(`Pull failed: ${errorMessage}`);
    } finally {
      setPullLoading(false);
    }
  };

  // Handle manual sync
  const handleManualSync = async () => {
    setManualSyncLoading(true);
    try {
      const result = await ApiService.manualSyncPull();
      if (result.success) {
        toast.success(result.message);
        loadFiles(currentPath); // Refresh file list
        loadStatus(); // Refresh status
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(`Manual sync failed: ${errorMessage}`);
    } finally {
      setManualSyncLoading(false);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    loadFiles(currentPath);
    loadStatus();
  };

  // Check backend availability
  const checkBackend = async () => {
    const available = await ApiService.isBackendAvailable();
    setBackendAvailable(available);
    if (!available) {
      toast.error("Backend server is not available");
    }
  };

  // Initial load
  useEffect(() => {
    checkBackend();
    loadFiles();
    loadStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Folder className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  GitHub Sync System
                </h1>
                <p className="text-sm text-gray-600">
                  Sync files across PCs via GitHub
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!backendAvailable && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  <span>Backend Offline</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={!backendAvailable}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(!showUpload)}
                disabled={!backendAvailable}
                className="flex items-center space-x-1"
              >
                <UploadIcon className="h-4 w-4" />
                <span>Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Upload section */}
        {showUpload && (
          <div className="mb-6">
            <FileUpload
              currentPath={currentPath}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - File tree */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <FileTree
                files={files}
                currentPath={currentPath}
                onFileSelect={handleFileSelect}
                onFolderNavigate={handleFolderNavigate}
                selectedFile={selectedFile}
              />
              {filesLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </Card>
          </div>

          {/* Main content - Code viewer */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CodeViewer
                fileContent={fileContent}
                loading={fileContentLoading}
                error={fileContentError}
              />
            </Card>
          </div>

          {/* Right sidebar - Status panel */}
          <div className="lg:col-span-1">
            <GitStatusPanel
              gitStatus={gitStatus}
              syncStatus={syncStatus}
              loading={statusLoading}
              onCommitPush={handleCommitPush}
              onPull={handlePull}
              onManualSync={handleManualSync}
              commitPushLoading={commitPushLoading}
              pullLoading={pullLoading}
              manualSyncLoading={manualSyncLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
