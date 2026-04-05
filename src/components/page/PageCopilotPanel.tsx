import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { usePageCopilot } from '@/hooks/usePageCopilot';
import type { PageDocument } from '@/types/page';
import type { PageCopilotSuggestion } from '@/types/pageCopilot';

export interface PageCopilotPanelProps {
  page: PageDocument | null;
  onApply: (suggestion: PageCopilotSuggestion) => void;
  onRevert: () => void;
  canRevert: boolean;
}

export function PageCopilotPanel({ page, onApply, onRevert, canRevert }: PageCopilotPanelProps) {
  const [prompt, setPrompt] = useState('');
  const copilot = usePageCopilot({ page });

  const handleSubmit = async () => {
    const trimmed = prompt.trim();

    if (!trimmed || copilot.isLoading) {
      return;
    }

    await copilot.requestSuggestion(trimmed);
    setPrompt('');
  };

  const handleApply = () => {
    if (!copilot.suggestion) {
      return;
    }

    onApply(copilot.suggestion);
  };

  const handleDismiss = () => {
    copilot.clearSuggestion();
  };

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 rounded-lg border bg-background p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">AI copilot</h2>
        <p className="text-sm text-muted-foreground">
          Describe a page change, review the structured suggestion, then apply it to the draft.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="page-copilot-prompt" className="text-sm font-medium">
          Copilot prompt
        </label>
        <Textarea
          id="page-copilot-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Make this feel more like Tumblr"
          className="min-h-28"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!prompt.trim() || copilot.isLoading}
          >
            {copilot.isLoading ? 'Asking...' : 'Ask copilot'}
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleDismiss}
            disabled={!copilot.suggestion}
          >
            Dismiss suggestion
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onRevert}
            disabled={!canRevert}
          >
            Revert AI change
          </button>
        </div>
      </div>

      {copilot.error ? (
        <Alert variant="destructive">
          <AlertTitle>Copilot error</AlertTitle>
          <AlertDescription>{copilot.error}</AlertDescription>
        </Alert>
      ) : null}

      {copilot.suggestion ? (
        <div data-testid="copilot-suggestion" className="space-y-3 rounded-lg border p-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Suggested change</h3>
            <p className="text-sm text-muted-foreground">{copilot.suggestion.message}</p>
          </div>
          <ul className="space-y-1 text-sm">
            {copilot.suggestion.operations.map((operation, index) => (
              <li key={`${operation.type}-${index}`} className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                {operation.type}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleApply}
          >
            Apply suggestion
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-2">
        <h3 className="text-sm font-semibold">Chat history</h3>
        <ScrollArea data-testid="copilot-history" className="h-64 rounded-lg border">
          <div className="space-y-3 p-3">
            {copilot.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No copilot messages yet.</p>
            ) : (
              copilot.messages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {message.role}
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2 text-sm">{message.content}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

export default PageCopilotPanel;
