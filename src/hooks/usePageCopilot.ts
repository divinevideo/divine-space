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

const PAGE_COPILOT_SCHEMA_PROMPT = [
  'Return JSON with this exact top-level shape:',
  '{"message":"short summary","operations":[...]}',
  'Allowed operations:',
  '{"type":"set_page_title","title":"New title"}',
  '{"type":"set_page_summary","summary":"New summary"}',
  '{"type":"add_widget","widgetType":"profile|top8|music|links|videos|mood|gallery|notes|events|embed|text|spacer","position":{"x":0,"y":0},"size":{"w":2,"h":2},"config":{}}',
  '{"type":"update_widget","widgetId":"existing-widget-id","updates":{"x":0,"y":0,"w":2,"h":2,"config":{}}}',
  '{"type":"remove_widget","widgetId":"existing-widget-id"}',
  'Do not include any operation type other than those listed above.',
].join('\n');

const PAGE_COPILOT_SYSTEM_PROMPT = [
  'You are the Divine page copilot.',
  'Respond with valid JSON only.',
  'Use only the supported page operation schema.',
  'Do not emit HTML, CSS, or freeform markdown.',
  PAGE_COPILOT_SCHEMA_PROMPT,
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
  const {
    sendChatMessage,
    isLoading,
    error: shakespeareError,
    clearError: clearShakespeareError,
  } = useShakespeare();
  const [messages, setMessages] = useState<PageCopilotMessage[]>([]);
  const [suggestion, setSuggestion] = useState<PageCopilotSuggestion | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setLocalError(null);
    clearShakespeareError();
  }, [clearShakespeareError]);

  const requestSuggestion = useCallback(async (prompt: string) => {
    setLocalError(null);

    const userMessage: PageCopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    };

    try {
      const response = await sendChatMessage([
        {
          role: 'system',
          content: createSystemPrompt(page),
        } satisfies ChatMessage,
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        }) satisfies ChatMessage),
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate a copilot suggestion';
      setLocalError(message);
      throw error;
    }
  }, [messages, page, sendChatMessage]);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  return {
    messages,
    suggestion,
    requestSuggestion,
    clearSuggestion,
    isLoading,
    error: localError ?? shakespeareError,
    clearError,
  };
}

export default usePageCopilot;
