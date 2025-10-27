/**
 * Agent Llama - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { spawn } from 'child_process';
import os from 'os';

/**
 * Opens a native directory picker dialog
 * Returns the selected directory path or null if cancelled
 */
export function openDirectoryPicker(): Promise<string | null> {
  return new Promise((resolve) => {
    const platform = os.platform();

    if (platform === 'darwin') {
      // macOS - use osascript (AppleScript)
      const script = `
        POSIX path of (choose folder with prompt "Select Working Directory")
      `;

      const child = spawn('osascript', ['-e', script]);
      let output = '';
      let _error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        _error += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && output.trim()) {
          // Remove trailing newline and resolve
          resolve(output.trim());
        } else {
          // User cancelled or error
          resolve(null);
        }
      });

    } else if (platform === 'linux') {
      // Linux - try zenity first, then kdialog
      const child = spawn('zenity', ['--file-selection', '--directory', '--title=Select Working Directory']);
      let output = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim());
        } else {
          // Try kdialog as fallback
          const kdialog = spawn('kdialog', ['--getexistingdirectory', '.', '--title', 'Select Working Directory']);
          let kdialogOutput = '';

          kdialog.stdout.on('data', (data) => {
            kdialogOutput += data.toString();
          });

          kdialog.on('close', (kdialogCode) => {
            if (kdialogCode === 0 && kdialogOutput.trim()) {
              resolve(kdialogOutput.trim());
            } else {
              resolve(null);
            }
          });
        }
      });

    } else if (platform === 'win32') {
      // Windows - use PowerShell
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = "Select Working Directory"
        $result = $dialog.ShowDialog()
        if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
          Write-Output $dialog.SelectedPath
        }
      `;

      const child = spawn('powershell', ['-Command', script]);
      let output = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim());
        } else {
          resolve(null);
        }
      });

    } else {
      // Unsupported platform
      console.error('❌ Directory picker not supported on platform:', platform);
      resolve(null);
    }
  });
}
