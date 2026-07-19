import { useState, useMemo, useActionState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { JiraTicket, RepoFile } from '@ticket-tdd/shared-types';
import { Button } from './ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from './ui/dialog';
import { FileTreePanel } from './FileTreePanel';
import { CodeViewer } from './CodeViewer';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setSelectedPaths } from '../store/repoSlice';
import { storeGeneratedTests, storeGeneratedImplementation } from '../store/ticketWorkflowSlice';
import { readSelectedFilesContent } from '../api/fileHandleStore';
import * as apiClient from '../api/apiClient';
import type { GenerateTestsResponse, GenerateImplementationResponse } from '@ticket-tdd/shared-types';

const MAX_CHARS = 100_000;
const STOP_WORDS = new Set([
  'add', 'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are',
  'should', 'when', 'have', 'will', 'into', 'then', 'also', 'can',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

type GenerationMode = 'tests' | 'implementation';

type Stage =
  | { name: 'selecting' }
  | { name: 'generating' }
  | { name: 'result'; data: GenerateTestsResponse | GenerateImplementationResponse };

interface FileSelectionDialogProps {
  ticket: JiraTicket;
  mode: GenerationMode;
  onClose: () => void;
}

export function FileSelectionDialog({ ticket, mode, onClose }: FileSelectionDialogProps) {
  const dispatch = useAppDispatch();
  const allFiles = useAppSelector((state) => state.repo.files);
  const existingTests = useAppSelector(
    (state) => state.ticketWorkflow.generatedTests[ticket.id]
  );

  // Auto-select files whose path contains a ticket keyword on first open
  const autoSelectedPaths = useMemo(() => {
    const keywords = extractKeywords(`${ticket.summary} ${ticket.description}`);
    return allFiles
      .filter((f) => keywords.some((kw) => f.path.toLowerCase().includes(kw)))
      .map((f) => f.path)
      .slice(0, 15); // cap auto-selection at 15 files
  }, [ticket, allFiles]);

  const [selectedPaths, setSelectedPathsLocal] = useState<string[]>(autoSelectedPaths);
  const [stage, setStage] = useState<Stage>({ name: 'selecting' });
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Track estimated total char size (approximated from file sizes)
  const estimatedTotalChars = useMemo(() => {
    const sizeMap = new Map(allFiles.map((f) => [f.path, f.size]));
    return selectedPaths.reduce((sum, path) => sum + (sizeMap.get(path) ?? 0), 0);
  }, [selectedPaths, allFiles]);

  const isOverLimit = estimatedTotalChars > MAX_CHARS;

  function togglePath(path: string) {
    setSelectedPathsLocal((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  }

  function selectAll() {
    setSelectedPathsLocal(allFiles.map((f) => f.path));
  }

  function clearAll() {
    setSelectedPathsLocal([]);
  }

  async function handleGenerate() {
    if (selectedPaths.length === 0) {
      setGenerateError('Select at least one file before generating.');
      return;
    }
    if (isOverLimit) {
      setGenerateError('Deselect files until the total is below 100,000 characters.');
      return;
    }

    setGenerateError(null);
    setStage({ name: 'generating' });
    // Persist selection to Redux for the next dialog open
    dispatch(setSelectedPaths(selectedPaths));

    try {
      let files: RepoFile[];
      try {
        const contents = await readSelectedFilesContent(selectedPaths);
        files = contents;
      } catch {
        throw new Error('Could not read file contents. Reconnect the codebase and try again.');
      }

      if (mode === 'tests') {
        const result = await apiClient.postGenerateTests({
          ticketSummary: ticket.summary,
          ticketDescription: ticket.description,
          files,
        });
        dispatch(storeGeneratedTests({ ticketId: ticket.id, result }));
        toast.success('Tests generated!');
        setStage({ name: 'result', data: result });
      } else {
        if (!existingTests) throw new Error('Generate tests first before generating an implementation.');
        const result = await apiClient.postGenerateImplementation({
          testFileName: existingTests.testFileName,
          testFileContent: existingTests.testFileContent,
          files,
        });
        dispatch(storeGeneratedImplementation({ ticketId: ticket.id, result }));
        toast.success('Implementation generated!');
        setStage({ name: 'result', data: result });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed.';
      toast.error(message);
      setGenerateError(message);
      setStage({ name: 'selecting' });
    }
  }

  const dialogTitle =
    mode === 'tests'
      ? `Generate Tests — ${ticket.key}`
      : `Generate Implementation — ${ticket.key}`;

  const isResult = stage.name === 'result';
  const resultData = isResult ? stage.data : null;
  const resultFileName =
    resultData && 'testFileName' in resultData
      ? resultData.testFileName
      : resultData && 'implementationFileName' in resultData
      ? resultData.implementationFileName
      : '';
  const resultCode =
    resultData && 'testFileContent' in resultData
      ? resultData.testFileContent
      : resultData && 'implementationFileContent' in resultData
      ? resultData.implementationFileContent
      : '';
  const assumptions = resultData?.assumptions ?? [];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription className="line-clamp-2">{ticket.summary}</DialogDescription>
        </DialogHeader>

        {/* File selection stage */}
        {stage.name === 'selecting' && (
          <>
            {allFiles.length === 0 ? (
              <div className="rounded-md border border-muted bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                No codebase connected. Connect one via the header button to include file context.
              </div>
            ) : (
              <FileTreePanel
                selectedPaths={selectedPaths}
                onTogglePath={togglePath}
                onSelectAll={selectAll}
                onClearAll={clearAll}
                totalChars={estimatedTotalChars}
              />
            )}

            {generateError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {generateError}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => void handleGenerate()} disabled={isOverLimit}>
                Generate
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Generating stage */}
        {stage.name === 'generating' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {mode === 'tests' ? 'Generating tests...' : 'Generating implementation...'}
            </p>
          </div>
        )}

        {/* Result stage */}
        {stage.name === 'result' && resultData && (
          <>
            {/* Assumptions callout */}
            {assumptions.length > 0 && (
              <div className="rounded-md border bg-muted/30 px-4 py-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Assumptions made by AI
                </p>
                <ul className="space-y-1">
                  {assumptions.map((assumption, index) => (
                    <li key={index} className="text-xs text-foreground">
                      • {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <CodeViewer fileName={resultFileName} code={resultCode} />

            <DialogFooter>
              <Button variant="outline" onClick={() => setStage({ name: 'selecting' })}>
                Regenerate
              </Button>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
