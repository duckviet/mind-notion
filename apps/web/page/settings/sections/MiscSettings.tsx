"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { toast } from "sonner";
import { Trash2, Download, Upload, AlertTriangle } from "lucide-react";

const MiscSettings = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [autoSave, setAutoSave] = React.useState(true);
  const [analytics, setAnalytics] = React.useState(false);

  const handleExportData = () => {
    toast.info("Export feature coming soon");
  };

  const handleImportData = () => {
    toast.info("Import feature coming soon");
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      toast.info("Account deletion feature coming soon");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-100">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Preferences & Data
        </h2>
        <p className="text-text-secondary">
          Manage application behavior and your personal data.
        </p>
      </div>

      {/* Preferences */}
      <Card className="border border-border shadow-sm  ">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Preferences
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            Configure how the application behaves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
              <Label
                htmlFor="notifications"
                className="text-base text-text-primary"
              >
                Notifications
              </Label>
              <p className="text-sm text-text-secondary">
                Receive desktop notifications.
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
              <Label htmlFor="autoSave" className="text-base text-text-primary">
                Auto Save
              </Label>
              <p className="text-sm text-text-secondary">
                Save changes automatically to the cloud.
              </p>
            </div>
            <Switch
              id="autoSave"
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
              <Label
                htmlFor="analytics"
                className="text-base text-text-primary"
              >
                Analytics
              </Label>
              <p className="text-sm text-text-secondary">
                Help improve the product with anonymous data.
              </p>
            </div>
            <Switch
              id="analytics"
              checked={analytics}
              onCheckedChange={setAnalytics}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border border-border shadow-sm  ">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Data Management
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            Export your data or import from a backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col space-y-3 rounded-lg border border-border p-4  -elevated hover:border-accent transition-colors">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-text-primary">
                Export Data
              </Label>
              <div className="h-9 w-9 rounded-full bg-accent-100 text-accent flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
            </div>
            <p className="text-sm text-text-secondary flex-1">
              Download all your workspace data as a JSON file.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleExportData}
            >
              Export
            </Button>
          </div>

          <div className="flex flex-col space-y-3 rounded-lg border border-border p-4  -elevated hover:border-accent transition-colors">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-text-primary">
                Import Data
              </Label>
              <div className="h-9 w-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center dark:bg-green-900/30">
                <Upload className="h-4 w-4" />
              </div>
            </div>
            <p className="text-sm text-text-secondary flex-1">
              Restore your data from a previously exported file.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleImportData}
            >
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-border shadow-sm  ">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Irreversible and destructive actions regarding your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border-2 border-destructive/50  dark:bg-red-950/20 p-4">
            <div className="space-y-0.5">
              <Label className="text-destructive font-semibold">
                Delete Account
              </Label>
              <p className="text-sm text-text-secondary max-w-sm">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleDeleteAccount}
              className="cursor-pointer dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 hover:text-red-700 border-2 border-destructive hover:border-red-600 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MiscSettings;
