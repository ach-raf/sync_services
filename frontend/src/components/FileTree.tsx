import React from "react";
import { Folder, File, ChevronRight } from "lucide-react";
import type { FileItem } from "../types/api";

interface FileTreeProps {
  files: FileItem[];
  currentPath: string;
  onFileSelect: (file: FileItem) => void;
  onFolderNavigate: (path: string) => void;
  selectedFile?: FileItem | null;
}

interface FileTreeItemProps {
  file: FileItem;
  onFileSelect: (file: FileItem) => void;
  onFolderNavigate: (path: string) => void;
  isSelected: boolean;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  onFileSelect,
  onFolderNavigate,
  isSelected,
}) => {
  const handleClick = () => {
    if (file.is_directory) {
      onFolderNavigate(file.path);
    } else {
      onFileSelect(file);
    }
  };

  const formatFileSize = (size?: number): string => {
    if (!size) return "";

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-100 border-l-4 border-blue-500" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-1 flex-1 min-w-0">
        {file.is_directory ? (
          <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
        ) : (
          <File className="h-4 w-4 text-gray-600 flex-shrink-0" />
        )}
        <span className="text-sm font-medium truncate">{file.name}</span>
      </div>

      <div className="flex items-center space-x-2 text-xs text-gray-500">
        {!file.is_directory && file.size && (
          <span className="hidden sm:inline">{formatFileSize(file.size)}</span>
        )}
        {file.modified && (
          <span className="hidden md:inline">{formatDate(file.modified)}</span>
        )}
      </div>
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({
  files,
  currentPath,
  onFileSelect,
  onFolderNavigate,
  selectedFile,
}) => {
  const handleBackClick = () => {
    if (currentPath) {
      const parentPath = currentPath.split("/").slice(0, -1).join("/");
      onFolderNavigate(parentPath);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Files</h2>
          {currentPath && (
            <button
              onClick={handleBackClick}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Current path */}
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-mono">files/{currentPath || ""}</span>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Folder className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No files in this directory</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {files.map((file) => (
              <FileTreeItem
                key={file.path}
                file={file}
                onFileSelect={onFileSelect}
                onFolderNavigate={onFolderNavigate}
                isSelected={selectedFile?.path === file.path}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileTree;
