import React, { useEffect } from "react";
import { File, Download, Copy, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import type { FileContent } from "../types/api";

// Import Prism.js for syntax highlighting
import Prism from "prismjs";
import "prismjs/themes/prism.css";

// Import common language definitions
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";

interface CodeViewerProps {
  fileContent: FileContent | null;
  loading: boolean;
  error: string | null;
}

const CodeViewer: React.FC<CodeViewerProps> = ({
  fileContent,
  loading,
  error,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    // Highlight code when content changes
    if (fileContent) {
      Prism.highlightAll();
    }
  }, [fileContent]);

  const handleCopy = async () => {
    if (fileContent?.content) {
      try {
        await navigator.clipboard.writeText(fileContent.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

  const handleDownload = () => {
    if (fileContent) {
      const blob = new Blob([fileContent.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileContent.path.split("/").pop() || "file.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const getLanguageDisplayName = (language: string): string => {
    const displayNames: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      markdown: "Markdown",
      bash: "Bash",
      text: "Plain Text",
    };
    return displayNames[language] || language.toUpperCase();
  };

  const getPrismLanguage = (language: string): string => {
    const languageMap: Record<string, string> = {
      javascript: "javascript",
      typescript: "typescript",
      python: "python",
      html: "markup",
      css: "css",
      json: "json",
      markdown: "markdown",
      bash: "bash",
      text: "text",
    };
    return languageMap[language] || "text";
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <File className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-2">Error loading file</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!fileContent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <File className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600">Select a file to view its content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-lg">
                {fileContent.path.split("/").pop()}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{getLanguageDisplayName(fileContent.language)}</span>
                <span>{formatFileSize(fileContent.size)}</span>
                <span>Modified: {formatDate(fileContent.modified)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center space-x-1"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <pre className="h-full">
          <code
            className={`language-${getPrismLanguage(fileContent.language)}`}
          >
            {fileContent.content}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;
