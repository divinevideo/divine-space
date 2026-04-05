import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PageDocument } from '@/types/page';
import type { ChatCompletionResponse } from './useShakespeare';
import { usePageCopilot } from './usePageCopilot';

const sendChatMessage = vi.fn();
const clearError = vi.fn();

vi.mock('./useShakespeare', () => ({
  useShakespeare: vi.fn(() => ({
    sendChatMessage,
    isLoading: false,
    error: null,
    clearError,
  })),
}));

const page: PageDocument = {
  identifier: 'profile-draft',
  shell: { type: 'sidebar-bento' },
  includes: [],
  widgets: [
    {
      id: 'profile-1',
      type: 'profile',
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    },
    {
      id: 'links-1',
      type: 'links',
      x: 2,
      y: 0,
      w: 2,
      h: 2,
    },
  ],
  title: 'My Page',
  summary: 'Creator page',
};

function createChatResponse(content: ChatCompletionResponse['choices'][number]['message']['content']): ChatCompletionResponse {
  return {
    id: 'chatcmpl-1',
    object: 'chat.completion',
    created: 1,
    model: 'shakespeare',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 1,
      completion_tokens: 1,
      total_tokens: 2,
    },
  };
}

describe('usePageCopilot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits the current draft context and returns a validated suggestion', async () => {
    sendChatMessage.mockResolvedValueOnce(createChatResponse(JSON.stringify({
      message: 'Updated page',
      operations: [
        { type: 'set_page_title', title: 'Creator Home' },
      ],
    })));

    const { result } = renderHook(() => usePageCopilot({ page }));

    await act(async () => {
      await result.current.requestSuggestion('Make it more like Tumblr');
    });

    expect(sendChatMessage).toHaveBeenCalledTimes(1);
    expect(sendChatMessage.mock.calls[0][0][0]).toMatchObject({
      role: 'system',
    });
    expect(sendChatMessage.mock.calls[0][0][0].content).toContain('set_page_title');
    expect(sendChatMessage.mock.calls[0][0][0].content).toContain('set_page_summary');
    expect(sendChatMessage.mock.calls[0][0][0].content).toContain('add_widget');
    expect(sendChatMessage.mock.calls[0][0][0].content).toContain('update_widget');
    expect(sendChatMessage.mock.calls[0][0][0].content).toContain('remove_widget');
    await waitFor(() => {
      expect(result.current.suggestion?.operations).toHaveLength(1);
      expect(result.current.messages).toHaveLength(2);
    });
  });

  it('extracts JSON from Shakespeare response choices[0].message.content', async () => {
    sendChatMessage.mockResolvedValueOnce(createChatResponse(JSON.stringify({
      message: 'Updated page',
      operations: [
        { type: 'set_page_title', title: 'Creator Home' },
      ],
    })));

    const { result } = renderHook(() => usePageCopilot({ page }));

    await act(async () => {
      await result.current.requestSuggestion('Add a text block');
    });

    expect(sendChatMessage).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.suggestion?.message).toBe('Updated page');
    });
  });

  it('sends prior turns back to Shakespeare for follow-up prompts', async () => {
    sendChatMessage
      .mockResolvedValueOnce(createChatResponse(JSON.stringify({
        message: 'Updated page',
        operations: [{ type: 'set_page_title', title: 'Creator Home' }],
      })))
      .mockResolvedValueOnce(createChatResponse(JSON.stringify({
        message: 'Moved links higher',
        operations: [],
      })));

    const { result } = renderHook(() => usePageCopilot({ page }));

    await act(async () => {
      await result.current.requestSuggestion('Make it more like Tumblr');
    });

    await act(async () => {
      await result.current.requestSuggestion('Now move the links higher');
    });

    expect(sendChatMessage).toHaveBeenCalledTimes(2);
    expect(sendChatMessage.mock.calls[1][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Make it more like Tumblr' }),
        expect.objectContaining({ role: 'assistant', content: 'Updated page' }),
        expect.objectContaining({ role: 'user', content: 'Now move the links higher' }),
      ])
    );
  });

  it('rejects Shakespeare responses whose message content is not a string', async () => {
    sendChatMessage.mockResolvedValueOnce(createChatResponse([
      { type: 'text', text: '{"message":"Updated page","operations":[]}' },
    ]));

    const { result } = renderHook(() => usePageCopilot({ page }));

    await act(async () => {
      await expect(result.current.requestSuggestion('Add a text block')).rejects.toThrow(/string/i);
    });
  });

  it('surfaces malformed AI responses as errors', async () => {
    sendChatMessage.mockResolvedValueOnce(createChatResponse('not json'));

    const { result } = renderHook(() => usePageCopilot({ page }));

    await act(async () => {
      await expect(result.current.requestSuggestion('break it')).rejects.toThrow(/invalid/i);
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/invalid copilot suggestion payload/i);
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
