import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAppSelector } from '../store/store';
import { cn } from '@/lib/utils';

const MAX_COMBINED_CHARS = 100_000;

interface FileTreePanelProps {
  selectedPaths: string[];
  onTogglePath: (path: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  /** Total combined character count of selected file contents */
  totalChars: number;
}

export function FileTreePanel({
  selectedPaths,
  onTogglePath,
  onSelectAll,
  onClearAll,
  totalChars,
}: FileTreePanelProps) {
  const files = useAppSelector((state) => state.repo.files);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const filteredFiles = useMemo(
    () =>
      files.filter((f) =>
        searchQuery.trim() === '' || f.path.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [files, searchQuery]
  );

  const isOverLimit = totalChars > MAX_COMBINED_CHARS;

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
        <p>No codebase connected yet.</p>
        <p className="mt-1 text-xs">Use the "Connect Codebase" button in the header.</p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 px-0 text-sm font-medium">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Files ({files.length})
            </Button>
          </CollapsibleTrigger>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={onSelectAll}>
              Select all
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={onClearAll}>
              Clear
            </Button>
          </div>
        </div>

        {/* Character usage warning */}
        {isOverLimit && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <Badge variant="destructive" className="text-xs">Over limit</Badge>
            Combined content exceeds 100,000 characters. Deselect files to reduce.
          </div>
        )}
        {!isOverLimit && selectedPaths.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedPaths.length} file{selectedPaths.length !== 1 ? 's' : ''} selected ·{' '}
            {(totalChars / 1000).toFixed(1)}k chars
          </p>
        )}

        <CollapsibleContent className="space-y-2">
          {/* Search/filter input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* File list */}
          <div className="max-h-[300px] overflow-y-auto rounded-md border">
            {filteredFiles.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No files match your filter.</p>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedPaths.includes(file.path);
                return (
                  <label
                    key={file.path}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 border-b px-3 py-2 text-xs last:border-0 hover:bg-muted/50',
                      isSelected && 'bg-muted/30'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onTogglePath(file.path)}
                      className="shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate font-mono" title={file.path}>
                      {file.path}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {(file.size / 1024).toFixed(1)}k
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
