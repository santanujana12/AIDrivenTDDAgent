import { FolderOpen, FolderCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setRepository } from '../store/repoSlice';
import { storeFileHandle, clearFileHandles } from '../api/fileHandleStore';
import type { RepoFileMetadata } from '../store/repoSlice';

// Directories to skip when walking the repo tree
const SKIPPED_DIRECTORIES = new Set([
  'node_modules', '.git', 'dist', 'build', '.next',
  'coverage', '.cache', '.nx', 'out', '.turbo',
]);

// Binary/generated file extensions to skip
const SKIPPED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.avif',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.lock', '.map', '.zip', '.tar', '.gz', '.br',
  '.pdf', '.mp4', '.mp3', '.wav',
]);

interface WalkedFile {
  path: string;
  size: number;
  handle: FileSystemFileHandle;
}

async function walkDirectory(
  dirHandle: FileSystemDirectoryHandle,
  prefix: string
): Promise<WalkedFile[]> {
  const results: WalkedFile[] = [];

  for await (const entry of dirHandle.values()) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;

    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      const nested = await walkDirectory(entry as FileSystemDirectoryHandle, fullPath);
      results.push(...nested);
    } else {
      const extension = entry.name.includes('.')
        ? `.${entry.name.split('.').pop()!.toLowerCase()}`
        : '';
      if (SKIPPED_EXTENSIONS.has(extension)) continue;

      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      results.push({ path: fullPath, size: file.size, handle: fileHandle });
    }
  }

  return results;
}

export function RepoConnector() {
  const dispatch = useAppDispatch();
  const directoryName = useAppSelector((state) => state.repo.directoryName);
  const fileCount = useAppSelector((state) => state.repo.files.length);

  async function connectDirectory() {
    if (!('showDirectoryPicker' in window)) {
      toast.error('This feature requires a Chromium-based browser (Chrome or Edge).');
      return;
    }

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await window.showDirectoryPicker();
    } catch (err: unknown) {
      // User dismissed the picker — not an error
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('Could not open directory picker.');
      return;
    }

    try {
      const walkedFiles = await walkDirectory(dirHandle, '');

      // Replace handles in the module-level store, keeping Redux serializable
      clearFileHandles();
      const metadataList: RepoFileMetadata[] = [];
      for (const { path, size, handle } of walkedFiles) {
        storeFileHandle(path, handle);
        metadataList.push({ path, size });
      }

      dispatch(setRepository({ directoryName: dirHandle.name, files: metadataList }));
      toast.success(`Connected "${dirHandle.name}" — ${walkedFiles.length} files indexed.`);
    } catch {
      toast.error('Failed to read the selected directory.');
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void connectDirectory()} className="gap-2">
      {directoryName ? (
        <>
          <FolderCheck className="h-4 w-4 text-green-500" />
          {directoryName} ({fileCount})
        </>
      ) : (
        <>
          <FolderOpen className="h-4 w-4" />
          Connect Codebase
        </>
      )}
    </Button>
  );
}
