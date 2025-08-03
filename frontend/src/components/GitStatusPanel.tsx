import React from "react";
import {
  GitBranch,
  Cloud,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import type { GitStatus, SyncStatus } from "../types/api";

interface GitStatusPanelProps {
  gitStatus: GitStatus | null;
  syncStatus: SyncStatus | null;
  loading: boolean;
  onCommitPush: () => void;
  onPull: () => void;
  onManualSync: () => void;
  commitPushLoading: boolean;
  pullLoading: boolean;
  manualSyncLoading: boolean;
}

const GitStatusPanel: React.FC<GitStatusPanelProps> = ({
  gitStatus,
  syncStatus,
  loading,
  onCommitPush,
  onPull,
  onManualSync,
  commitPushLoading,
  pullLoading,
  manualSyncLoading,
}) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Never";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (): string => {
    if (!gitStatus) return "text-gray-500";

    if (!gitStatus.is_clean) return "text-orange-600";
    if (gitStatus.behind > 0) return "text-blue-600";
    if (gitStatus.ahead > 0) return "text-green-600";

    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (!gitStatus) return <AlertCircle className="h-5 w-5 text-gray-500" />;

    if (!gitStatus.is_clean)
      return <Clock className="h-5 w-5 text-orange-600" />;
    if (gitStatus.behind > 0)
      return <ArrowDown className="h-5 w-5 text-blue-600" />;
    if (gitStatus.ahead > 0)
      return <ArrowUp className="h-5 w-5 text-green-600" />;

    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getStatusMessage = (): string => {
    if (!gitStatus) return "Git status unavailable";

    if (!gitStatus.is_clean) return "Uncommitted changes";
    if (gitStatus.behind > 0 && gitStatus.ahead > 0) {
      return `${gitStatus.ahead} ahead, ${gitStatus.behind} behind`;
    }
    if (gitStatus.behind > 0) return `${gitStatus.behind} commits behind`;
    if (gitStatus.ahead > 0) return `${gitStatus.ahead} commits ahead`;

    return "Up to date";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5" />
          <span>Git Status</span>
        </CardTitle>
        <CardDescription>Current repository and sync status</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Git Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className={`font-medium ${getStatusColor()}`}>
                {getStatusMessage()}
              </span>
            </div>
          </div>

          {gitStatus && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Branch:</span>
                <span className="ml-1 font-mono">
                  {gitStatus.current_branch}
                </span>
              </div>

              {gitStatus.last_commit && (
                <div>
                  <span className="text-gray-600">Last commit:</span>
                  <span className="ml-1 font-mono">
                    {gitStatus.last_commit}
                  </span>
                </div>
              )}
            </div>
          )}

          {gitStatus?.last_commit_message && (
            <div className="text-sm">
              <span className="text-gray-600">Message:</span>
              <p className="mt-1 text-gray-800 italic">
                "{gitStatus.last_commit_message}"
              </p>
            </div>
          )}
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center space-x-2">
              <Cloud className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Auto-sync</span>
              <span
                className={`text-sm ${
                  syncStatus.is_running ? "text-green-600" : "text-gray-500"
                }`}
              >
                {syncStatus.is_running ? "Running" : "Stopped"}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              Last sync: {formatDate(syncStatus.last_pull_time)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onPull}
              disabled={pullLoading || !gitStatus}
              variant="outline"
              className="flex items-center space-x-1"
            >
              {pullLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>Pull</span>
            </Button>

            <Button
              onClick={onCommitPush}
              disabled={commitPushLoading || !gitStatus || gitStatus.is_clean}
              className="flex items-center space-x-1"
            >
              {commitPushLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
              <span>Commit & Push</span>
            </Button>
          </div>

          <Button
            onClick={onManualSync}
            disabled={manualSyncLoading}
            variant="outline"
            className="w-full flex items-center space-x-1"
          >
            {manualSyncLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Cloud className="h-4 w-4" />
            )}
            <span>Manual Sync</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GitStatusPanel;
