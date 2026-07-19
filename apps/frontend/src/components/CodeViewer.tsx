import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface CodeViewerProps {
  fileName: string;
  code: string;
  className?: string;
}

const extensionToLanguage: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  java: 'java',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  css: 'css',
  html: 'html',
  json: 'json',
  md: 'markdown',
  sh: 'bash',
  yaml: 'yaml',
  yml: 'yaml',
};

function inferLanguage(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return extensionToLanguage[extension] ?? 'plaintext';
}

export function CodeViewer({ fileName, code, className }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{fileName}</span>
        <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-1.5 text-xs">
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <SyntaxHighlighter
        language={inferLanguage(fileName)}
        style={atomOneDark}
        showLineNumbers
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8rem', maxHeight: '400px' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
