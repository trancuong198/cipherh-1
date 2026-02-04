/**
 * Code Modification Service
 * 
 * Cho phép CipherH tự đọc và sửa code của chính mình thông qua GitHub API
 * CẢNH BÁO: Đây là khả năng self-modification rất mạnh mẽ - cần cẩn thận!
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';
import { logger } from './logger';
import { gitSync } from './gitSync';
import { openAIService } from './openai';

export interface FileInfo {
  path: string;
  content: string;
  exists: boolean;
}

export interface ModificationResult {
  success: boolean;
  message: string;
  filePath?: string;
  changes?: string;
  error?: string;
  timestamp: string;
}

export class CodeModificationService {
  private readonly rootPath: string;
  private readonly allowedExtensions = ['.ts', '.js', '.json', '.md', '.txt', '.env.example'];
  private readonly protectedFiles = [
    '.env', // Không cho sửa file env thật
    'package-lock.json', // Không tự động sửa lock file
  ];

  constructor() {
    this.rootPath = process.cwd();
    logger.info('[CodeMod] Service initialized at:', this.rootPath);
  }

  /**
   * Đọc nội dung file
   */
  async readFile(relativePath: string): Promise<FileInfo> {
    try {
      const fullPath = join(this.rootPath, relativePath);
      
      // Security check
      if (!this.isPathSafe(relativePath)) {
        logger.warn(`[CodeMod] Unsafe path rejected: ${relativePath}`);
        return {
          path: relativePath,
          content: '',
          exists: false,
        };
      }

      if (!existsSync(fullPath)) {
        logger.info(`[CodeMod] File not found: ${relativePath}`);
        return {
          path: relativePath,
          content: '',
          exists: false,
        };
      }

      const content = readFileSync(fullPath, 'utf-8');
      logger.info(`[CodeMod] Read file: ${relativePath} (${content.length} chars)`);
      
      return {
        path: relativePath,
        content,
        exists: true,
      };
    } catch (error: any) {
      logger.error(`[CodeMod] Error reading file ${relativePath}:`, error);
      throw error;
    }
  }

  /**
   * Sửa nội dung file
   */
  async modifyFile(relativePath: string, newContent: string, reason: string): Promise<ModificationResult> {
    try {
      const fullPath = join(this.rootPath, relativePath);

      // Security checks
      if (!this.isPathSafe(relativePath)) {
        return {
          success: false,
          message: 'Path không an toàn hoặc không được phép',
          error: 'Unsafe path',
          timestamp: new Date().toISOString(),
        };
      }

      if (this.isProtectedFile(relativePath)) {
        return {
          success: false,
          message: 'File này được bảo vệ, không thể tự động sửa',
          error: 'Protected file',
          timestamp: new Date().toISOString(),
        };
      }

      // Read old content for comparison
      let oldContent = '';
      let isNewFile = false;
      
      if (existsSync(fullPath)) {
        oldContent = readFileSync(fullPath, 'utf-8');
      } else {
        isNewFile = true;
        // Create directory if not exists
        const dir = dirname(fullPath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      }

      // Write new content
      writeFileSync(fullPath, newContent, 'utf-8');
      
      const action = isNewFile ? 'Created' : 'Modified';
      logger.info(`[CodeMod] ${action} file: ${relativePath}`);
      logger.info(`[CodeMod] Reason: ${reason}`);

      // Calculate changes
      const changes = this.calculateChanges(oldContent, newContent);

      // Auto commit and push to GitHub
      const syncResult = await gitSync.syncToGithub();
      
      return {
        success: true,
        message: `${action} file successfully and synced to GitHub`,
        filePath: relativePath,
        changes,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`[CodeMod] Error modifying file ${relativePath}:`, error);
      return {
        success: false,
        message: 'Failed to modify file',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Xóa file
   */
  async deleteFile(relativePath: string, reason: string): Promise<ModificationResult> {
    try {
      const fullPath = join(this.rootPath, relativePath);

      // Security checks
      if (!this.isPathSafe(relativePath) || this.isProtectedFile(relativePath)) {
        return {
          success: false,
          message: 'Không thể xóa file này',
          error: 'Protected or unsafe path',
          timestamp: new Date().toISOString(),
        };
      }

      if (!existsSync(fullPath)) {
        return {
          success: false,
          message: 'File không tồn tại',
          error: 'File not found',
          timestamp: new Date().toISOString(),
        };
      }

      const fs = await import('fs');
      fs.unlinkSync(fullPath);
      
      logger.info(`[CodeMod] Deleted file: ${relativePath}`);
      logger.info(`[CodeMod] Reason: ${reason}`);

      // Auto commit and push
      await gitSync.syncToGithub();

      return {
        success: true,
        message: 'File deleted and synced to GitHub',
        filePath: relativePath,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`[CodeMod] Error deleting file ${relativePath}:`, error);
      return {
        success: false,
        message: 'Failed to delete file',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Bot tự quyết định sửa code dựa trên yêu cầu của user
   * NÂNG CẤP: Phân tích cấu trúc project và đọc các file liên quan trước khi sửa
   */
  async selfModifyCode(userRequest: string): Promise<ModificationResult> {
    try {
      logger.info(`[CodeMod] Self-modification request: ${userRequest.substring(0, 100)}...`);

      // BƯỚC 1: Phân tích cấu trúc project
      const projectStructure = await this.analyzeProjectStructure();
      
      // BƯỚC 2: Sử dụng OpenAI để phân tích yêu cầu với FULL CONTEXT
      const analysisPrompt = `
Bạn là CipherH - một AI có khả năng TỰ SỬA CODE của chính mình.

CẤU TRÚC PROJECT HIỆN TẠI:
${projectStructure}

YÊU CẦU CỦA USER:
${userRequest}

NHIỆM VỤ CỦA BẠN:
1. Phân tích yêu cầu và XÁC ĐỊNH FILE NÀO CẦN ĐỌC để hiểu context
2. Trả lời theo format JSON:

{
  "needsAnalysis": true/false,
  "filesToRead": ["path/to/file1.ts", "path/to/file2.ts"],
  "reasoning": "Tại sao cần đọc những file này"
}

QUAN TRỌNG:
- Nếu cần sửa code, phải đọc file đó + các file liên quan (imports, dependencies)
- Nếu tạo file mới, phải đọc các file tương tự để học pattern
- Nếu chỉ trả lời câu hỏi, needsAnalysis = false
`;

      const analysisResponse = await openAIService.askQuestion(analysisPrompt);
      logger.info('[CodeMod] Analysis response:', analysisResponse.substring(0, 200));

      let analysisDecision;
      try {
        const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisDecision = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in analysis response');
        }
      } catch (error) {
        logger.error('[CodeMod] Failed to parse analysis response:', error);
        return {
          success: false,
          message: 'AI không thể phân tích cấu trúc project',
          error: 'Failed to parse analysis response',
          timestamp: new Date().toISOString(),
        };
      }

      // BƯỚC 3: Đọc các file cần thiết nếu cần phân tích
      let contextFiles = '';
      if (analysisDecision.needsAnalysis && analysisDecision.filesToRead) {
        logger.info('[CodeMod] Reading context files:', analysisDecision.filesToRead);
        
        for (const filePath of analysisDecision.filesToRead.slice(0, 10)) { // Giới hạn 10 files
          try {
            const fileInfo = await this.readFile(filePath);
            if (fileInfo.exists) {
              contextFiles += `\n\n=== FILE: ${filePath} ===\n${fileInfo.content}`;
            }
          } catch (error) {
            logger.warn(`[CodeMod] Could not read file ${filePath}:`, error);
          }
        }
      }

      // BƯỚC 4: Tạo code với FULL CONTEXT
      const codeGenerationPrompt = `
Bạn là CipherH - một senior developer với khả năng TỰ SỬA CODE của chính mình.

CẤU TRÚC PROJECT:
${projectStructure}

${contextFiles ? `CÁC FILE LIÊN QUAN (ĐỂ HIỂU CONTEXT):\n${contextFiles}` : ''}

YÊU CẦU CỦA USER:
${userRequest}

LÝ DO PHÂN TÍCH:
${analysisDecision.reasoning || 'N/A'}

NHIỆM VỤ CỦA BẠN:
1. Dựa trên cấu trúc project và các file liên quan, hiểu RÕ pattern và architecture
2. Tạo code ĐÚNG PATTERN, ĐÚNG STYLE với codebase hiện tại
3. Đảm bảo imports đúng, types đúng, structure đúng
4. Trả lời theo format JSON:

{
  "action": "modify" | "create" | "none" | "multiple",
  "files": [
    {
      "path": "đường dẫn file (relative)",
      "action": "modify" | "create",
      "content": "Toàn bộ nội dung file mới",
      "reason": "Lý do sửa/tạo file này"
    }
  ],
  "explanation": "Giải thích CHI TIẾT những gì bạn đã làm và TẠI SAO",
  "confidence": 0-100 (độ tự tin vào code này)
}

QUAN TRỌNG - PHẢI FOLLOW PATTERNS:
- Nhìn vào các file hiện có để học PATTERN
- Imports phải giống với pattern của project
- Code style phải nhất quán
- Types/Interfaces phải đúng với TypeScript conventions của project
- Error handling phải giống với cách project đang làm
- Logging phải dùng logger service đã có
- Nếu confidence < 70, nên action = "none" và giải thích tại sao

VÍ DỤ TỐT:
- Nếu thấy project dùng logger.info(), thì dùng logger.info() thay vì console.log()
- Nếu thấy imports dùng relative paths, thì dùng relative paths
- Nếu thấy services export singleton pattern, thì follow pattern đó
`;

      const codeResponse = await openAIService.askQuestion(codeGenerationPrompt);
      logger.info('[CodeMod] Code generation response:', codeResponse.substring(0, 200));

      // Parse code generation response
      let codeDecision;
      try {
        const jsonMatch = codeResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          codeDecision = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in code response');
        }
      } catch (error) {
        logger.error('[CodeMod] Failed to parse code response:', error);
        return {
          success: false,
          message: 'AI không thể generate code',
          error: 'Failed to parse code response',
          timestamp: new Date().toISOString(),
        };
      }

      // Check confidence
      if (codeDecision.confidence && codeDecision.confidence < 70) {
        logger.warn(`[CodeMod] Low confidence: ${codeDecision.confidence}%`);
        return {
          success: false,
          message: `Độ tự tin thấp (${codeDecision.confidence}%). ${codeDecision.explanation}`,
          error: 'Low confidence',
          timestamp: new Date().toISOString(),
        };
      }

      // BƯỚC 5: Execute decision
      if (codeDecision.action === 'none') {
        return {
          success: true,
          message: 'Không cần sửa code: ' + codeDecision.explanation,
          timestamp: new Date().toISOString(),
        };
      }

      if (codeDecision.action === 'modify' || codeDecision.action === 'create') {
        // Single file modification
        const file = codeDecision.files?.[0];
        if (!file) {
          return {
            success: false,
            message: 'No file specified',
            error: 'Invalid response',
            timestamp: new Date().toISOString(),
          };
        }

        return await this.modifyFile(
          file.path,
          file.content,
          file.reason || codeDecision.explanation
        );
      }

      if (codeDecision.action === 'multiple') {
        // Multiple files modification
        const results = [];
        for (const file of codeDecision.files || []) {
          const result = await this.modifyFile(
            file.path,
            file.content,
            file.reason || codeDecision.explanation
          );
          results.push(result);
        }

        const allSuccess = results.every(r => r.success);
        return {
          success: allSuccess,
          message: allSuccess 
            ? `Successfully modified ${results.length} files`
            : `Some files failed to modify`,
          changes: results.map(r => r.message).join('\n'),
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        message: 'AI trả về action không hợp lệ',
        error: 'Invalid action',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('[CodeMod] Self-modification failed:', error);
      return {
        success: false,
        message: 'Lỗi khi tự sửa code',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Phân tích cấu trúc project
   */
  private async analyzeProjectStructure(): Promise<string> {
    try {
      const structure = [];
      
      // Main directories
      const mainDirs = ['server', 'client', 'shared'];
      
      for (const dir of mainDirs) {
        const dirPath = join(this.rootPath, dir);
        if (existsSync(dirPath)) {
          structure.push(`\n${dir}/`);
          await this.walkDirectory(dirPath, dir, structure, 2); // Max depth 2
        }
      }

      // Important root files
      const rootFiles = ['package.json', 'tsconfig.json', '.env.example'];
      for (const file of rootFiles) {
        const filePath = join(this.rootPath, file);
        if (existsSync(filePath)) {
          structure.push(`${file}`);
        }
      }

      return structure.join('\n');
    } catch (error) {
      logger.error('[CodeMod] Error analyzing project structure:', error);
      return 'Could not analyze project structure';
    }
  }

  /**
   * Walk directory recursively (with depth limit)
   */
  private async walkDirectory(fullPath: string, relativePath: string, result: string[], maxDepth: number, currentDepth: number = 0) {
    if (currentDepth >= maxDepth) return;

    try {
      const fs = await import('fs');
      const items = fs.readdirSync(fullPath);

      for (const item of items) {
        // Skip node_modules, dist, .git, etc.
        if (item === 'node_modules' || item === 'dist' || item === '.git' || 
            item === 'logs' || item === 'public' || item.startsWith('.')) {
          continue;
        }

        const itemPath = join(fullPath, item);
        const itemRelPath = `${relativePath}/${item}`;
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          result.push(`  ${'  '.repeat(currentDepth)}${item}/`);
          await this.walkDirectory(itemPath, itemRelPath, result, maxDepth, currentDepth + 1);
        } else {
          result.push(`  ${'  '.repeat(currentDepth)}${item}`);
        }
      }
    } catch (error) {
      // Ignore errors for individual directories
    }
  }

  /**
   * List files trong một thư mục
   */
  async listFiles(relativePath: string = '.'): Promise<string[]> {
    try {
      const fullPath = join(this.rootPath, relativePath);
      
      if (!this.isPathSafe(relativePath)) {
        return [];
      }

      const fs = await import('fs');
      if (!existsSync(fullPath)) {
        return [];
      }

      const files = fs.readdirSync(fullPath);
      return files;
    } catch (error: any) {
      logger.error(`[CodeMod] Error listing files in ${relativePath}:`, error);
      return [];
    }
  }

  /**
   * Check if path is safe (không escape khỏi project root)
   */
  private isPathSafe(relativePath: string): boolean {
    // Không cho phép .. trong path
    if (relativePath.includes('..')) {
      return false;
    }

    // Không cho phép absolute path
    if (relativePath.startsWith('/')) {
      return false;
    }

    // Phải có extension hợp lệ
    const hasValidExt = this.allowedExtensions.some(ext => relativePath.endsWith(ext));
    if (!hasValidExt && !relativePath.includes('.')) {
      // Cho phép folder (không có extension)
      return true;
    }

    return hasValidExt;
  }

  /**
   * Check if file is protected
   */
  private isProtectedFile(relativePath: string): boolean {
    return this.protectedFiles.some(protected => 
      relativePath.endsWith(protected) || relativePath.includes(protected)
    );
  }

  /**
   * Calculate changes between old and new content
   */
  private calculateChanges(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n').length;
    const newLines = newContent.split('\n').length;
    const diff = newLines - oldLines;

    if (oldContent === '') {
      return `Tạo file mới với ${newLines} dòng`;
    }

    if (diff > 0) {
      return `Thêm ${diff} dòng (${oldLines} → ${newLines})`;
    } else if (diff < 0) {
      return `Xóa ${Math.abs(diff)} dòng (${oldLines} → ${newLines})`;
    } else {
      return `Sửa nội dung (giữ nguyên ${newLines} dòng)`;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: true,
      rootPath: this.rootPath,
      allowedExtensions: this.allowedExtensions,
      protectedFiles: this.protectedFiles,
    };
  }
}

export const codeModificationService = new CodeModificationService();
