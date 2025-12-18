import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  changes?: number;
  error?: string;
}

export class GitSyncService {
  private isSyncing: boolean = false;

  async syncToGithub(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        message: "Sync already in progress",
        timestamp: new Date().toISOString(),
        error: "Another sync is running",
      };
    }

    this.isSyncing = true;

    try {
      console.log("Starting Git sync to GitHub");

      // Check if there are changes
      const statusResult = await execAsync("git status --porcelain", {
        cwd: process.cwd(),
      });

      const changes = statusResult.stdout.trim().split("\n").filter((l) => l).length;

      if (changes === 0) {
        console.log("No changes to commit");
        this.isSyncing = false;
        return {
          success: true,
          message: "No changes to sync",
          timestamp: new Date().toISOString(),
          changes: 0,
        };
      }

      // Stage all changes
      await execAsync("git add -A", { cwd: process.cwd() });
      console.log(`Staged ${changes} file(s)`);

      // Create commit with timestamp
      const commitMessage = `Auto-sync: ${new Date().toISOString()}`;
      await execAsync(`git -c user.name="CipherH Agent" -c user.email="cipherh@agent.local" commit -m "${commitMessage}"`, {
        cwd: process.cwd(),
      });
      console.log("Changes committed");

      // Push to GitHub
      const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
      const pushUrl = `https://trancuong198:${token}@github.com/trancuong198/cipherh-1.git`;
      await execAsync(`git push ${pushUrl} main --force`, {
        cwd: process.cwd(),
      });
      console.log("Changes pushed to GitHub");

      this.isSyncing = false;

      return {
        success: true,
        message: `Synced ${changes} file(s) to GitHub`,
        timestamp: new Date().toISOString(),
        changes,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Git sync failed", errorMessage);

      this.isSyncing = false;

      return {
        success: false,
        message: "Sync failed",
        timestamp: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const gitSync = new GitSyncService();
