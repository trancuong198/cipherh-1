/**
 * Git Workflow Configuration
 */

export type GitWorkflowMode = 'direct' | 'pull-request' | 'hybrid';

export interface GitWorkflowConfig {
  mode: GitWorkflowMode;
  targetBranch: string;
  requireReview: boolean;
  autoMergeThreshold: number;
  createDraftPR: boolean;
  enableAutoMerge: boolean;
  branchPrefix: string;
}

export function getGitWorkflowConfig(): GitWorkflowConfig {
  const mode = (process.env.GIT_WORKFLOW_MODE || 'pull-request') as GitWorkflowMode;
  
  return {
    mode,
    targetBranch: process.env.GIT_TARGET_BRANCH || 'main',
    requireReview: process.env.GIT_REQUIRE_REVIEW !== 'false',
    autoMergeThreshold: parseInt(process.env.AUTO_MERGE_THRESHOLD || '90'),
    createDraftPR: process.env.CREATE_DRAFT_PR === 'true',
    enableAutoMerge: process.env.ENABLE_AUTO_MERGE === 'true',
    branchPrefix: process.env.GIT_BRANCH_PREFIX || 'auto-fix',
  };
}

export const gitWorkflowConfig = getGitWorkflowConfig();
