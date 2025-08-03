import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface FileUploadProps {
  currentPath: string;
  onUploadComplete: (success: boolean, message: string) => void;
}

interface FileWithPath {
  file: File;
  path: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  currentPath,
  onUploadComplete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [customPath, setCustomPath] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPath = acceptedFiles.map((file) => ({
      file,
      path: file.name,
    }));
    setSelectedFiles((prev) => [...prev, ...filesWithPath]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    // Accept all file types
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFilePath = (index: number, newPath: string) => {
    setSelectedFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, path: newPath } : item))
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      onUploadComplete(false, "No files selected");
      return;
    }

    setUploading(true);

    try {
      // Import API service dynamically to avoid import errors during build
      const { ApiService } = await import("../services/api");

      // Determine upload path
      const uploadPath = customPath.trim() || currentPath;

      // Create File objects for upload
      const filesToUpload = selectedFiles.map((item) => item.file);

      const response = await ApiService.uploadFiles(filesToUpload, uploadPath);

      if (response.success) {
        onUploadComplete(true, response.message);
        setSelectedFiles([]);
        setCustomPath("");
      } else {
        onUploadComplete(false, response.message);
      }
    } catch (error) {
      const { handleApiError } = await import("../services/api");
      const errorMessage = handleApiError(error);
      onUploadComplete(false, errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTotalSize = (): string => {
    const total = selectedFiles.reduce((sum, item) => sum + item.file.size, 0);
    return formatFileSize(total);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Files</span>
        </CardTitle>
        <CardDescription>
          Drag and drop files here or click to select files to upload
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Custom path input */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Path (optional)
          </label>
          <Input
            type="text"
            placeholder={`Current: files/${currentPath || ""}`}
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to upload to current directory
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-1">
                Drag and drop files here, or click to select files
              </p>
              <p className="text-sm text-gray-500">Multiple files supported</p>
            </div>
          )}
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Selected Files ({selectedFiles.length})
              </h4>
              <span className="text-sm text-gray-600">
                Total: {getTotalSize()}
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2">
              {selectedFiles.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                >
                  <File className="h-4 w-4 text-gray-600 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <Input
                      type="text"
                      value={item.path}
                      onChange={(e) => updateFilePath(index, e.target.value)}
                      className="text-sm"
                      placeholder="File path..."
                    />
                  </div>

                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatFileSize(item.file.size)}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="p-1 h-6 w-6 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFiles([]);
              setCustomPath("");
            }}
            disabled={uploading || selectedFiles.length === 0}
          >
            Clear
          </Button>

          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload {selectedFiles.length} file(s)</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
