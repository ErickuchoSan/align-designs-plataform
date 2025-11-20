/**
 * Utility functions for file operations
 */

interface FileWithFilename {
  filename: string | null;
}

interface FilesAndCommentsCounts {
  filesCount: number;
  commentsCount: number;
}

/**
 * Separates files (entries with filename) from comments (entries without filename)
 * and returns their counts
 */
export function getFilesAndCommentsCounts<T extends FileWithFilename>(
  files: T[],
): FilesAndCommentsCounts {
  const filesCount = files.filter((f) => f.filename !== null).length;
  const commentsCount = files.filter((f) => f.filename === null).length;

  return {
    filesCount,
    commentsCount,
  };
}

/**
 * Checks if an entry is a file (has filename) or a comment (no filename)
 */
export function isFile<T extends FileWithFilename>(entry: T): boolean {
  return entry.filename !== null;
}

/**
 * Checks if an entry is a comment (no filename)
 */
export function isComment<T extends FileWithFilename>(entry: T): boolean {
  return entry.filename === null;
}
