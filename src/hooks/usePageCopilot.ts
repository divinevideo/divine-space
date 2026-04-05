import { useCallback, useState } from 'react';
import { useShakespeare, type ChatMessage } from './useShakespeare';
import {
  buildPageCopilotContext,
  parsePageCopilotSuggestion,
} from '@/lib/pageCopilot';
import type { PageDocument } from '@/types/page';
import type {
  PageCopilotMessage,
  PageCopilotSuggestion,
} from '@/types/pageCopilot';

const PAGE_COPILOT_SYSTEM_PROMPT = [
  'You are the Divine page copilot.',
  'Respond with valid JSON only.',
  'Use only the supported page operation schema.',
  'Do not emit HTML, CSS, or freeform markdown.',
].join(' ');

function createSystemPrompt(page: PageDocument | null): string {
  if (!page) {
    return PAGE_COPILOT_SYSTEM_PROMPT;
  }

  return `${PAGE_COPILOT_SYSTEM_PROMPT}\n\nCurrent draft:\n${buildPageCopilotContext(page)}`;
}

function extractAssistantContent(response: Awaited<ReturnType<ReturnType<typeof useShakespeare>['sendChatMessage']>>): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('Shakespeare response message content must be a string');
  }

  return content;
}

export interface UsePageCopilotOptions {
  page: PageDocument | null;
}

export interface UsePageCopilotResult {
  messages: PageCopilotMessage[];
  suggestion: PageCopilotSuggestion | null;
  requestSuggestion: (prompt: string) => Promise<PageCopilotSuggestion>;
  clearSuggestion: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function usePageCopilot({ page }: UsePageCopilotOptions): UsePageCopilotResult {
  const { sendChatMessage, isLoading, error, clearError } = useShakespeare();
  const [messages, setMessages] = useState<PageCopilotMessage[]>([]);
  const [suggestion, setSuggestion] = useState<PageCopilotSuggestion | null>(null);

  const requestSuggestion = useCallback(async (prompt: string) => {
    const userMessage: PageCopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    };

    const response = await sendChatMessage([
      {
        role: 'system',
        content: createSystemPrompt(page),
      } satisfies ChatMessage,
      {
        role: 'user',
        content: prompt,
      } satisfies ChatMessage,
    ]);

    const assistantContent = extractAssistantContent(response);
    const parsedSuggestion = parsePageCopilotSuggestion(assistantContent);

    const assistantMessage: PageCopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: parsedSuggestion.message,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setSuggestion(parsedSuggestion);

    return parsedSuggestion;
  }, [page, sendChatMessage]);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  return {
    messages,
    suggestion,
    requestSuggestion,
    clearSuggestion,
    isLoading,
    error,
    clearError,
  };
}

export default usePageCopilot;
