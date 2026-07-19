/**
 * Module-level store for FileSystemFileHandle objects.
 *
 * FileSystemFileHandle is not serializable, so it cannot live in Redux.
 * We keep handles here, keyed by relative file path, and store only
 * { path, size } metadata in the Redux repoSlice.
 */

const fileHandleMap = new Map<string, FileSystemFileHandle>();

export function storeFileHandle(path: string, handle: FileSystemFileHandle): void {
  fileHandleMap.set(path, handle);
}

export function getFileHandle(path: string): FileSystemFileHandle | undefined {
  return fileHandleMap.get(path);
}

export function clearFileHandles(): void {
  fileHandleMap.clear();
}

export async function readFileContent(path: string): Promise<string> {
  const handle = fileHandleMap.get(path);
  if (!handle) throw new Error(`No file handle stored for "${path}"`);
  const file = await handle.getFile();
  return file.text();
}

export async function readSelectedFilesContent(
  paths: string[]
): Promise<Array<{ path: string; content: string }>> {
  const results: Array<{ path: string; content: string }> = [];
  for (const path of paths) {
    const content = await readFileContent(path);
    results.push({ path, content });
  }
  return results;
}
