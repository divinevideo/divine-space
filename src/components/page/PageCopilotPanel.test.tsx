import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PageDocument } from '@/types/page';
import type { ChatCompletionResponse } from '@/hooks/useShakespeare';
import { PageCopilotPanel } from './PageCopilotPanel';

const sendChatMessage = vi.fn();
const clearError = vi.fn();

vi.mock('@/hooks/useShakespeare', () => ({
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
  ],
  title: 'My Page',
  summary: 'Creator page',
};

function createChatResponse(
  content: ChatCompletionResponse['choices'][number]['message']['content']
): ChatCompletionResponse {
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

describe('PageCopilotPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendChatMessage.mockResolvedValue(
      createChatResponse(
        JSON.stringify({
          message: 'Updated page',
          operations: [
            { type: 'set_page_title', title: 'Creator Home' },
            { type: 'add_widget', widgetType: 'text' },
          ],
        })
      )
    );
  });

  it('submits a prompt and shows the proposed operations', async () => {
    const onApply = vi.fn();
    const onRevert = vi.fn();

    render(
      <PageCopilotPanel
        page={page}
        onApply={onApply}
        onRevert={onRevert}
        canRevert={false}
      />
    );

    fireEvent.change(screen.getByLabelText(/copilot prompt/i), {
      target: { value: 'Add a text block' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ask copilot/i }));

    const suggestion = await screen.findByTestId('copilot-suggestion');
    expect(within(suggestion).getByText(/set_page_title/i)).toBeInTheDocument();
    expect(within(suggestion).getByText(/add_widget/i)).toBeInTheDocument();
    expect(within(suggestion).getByText(/updated page/i)).toBeInTheDocument();
  });

  it('calls onApply with the validated suggestion object', async () => {
    const onApply = vi.fn();
    const onRevert = vi.fn();

    render(
      <PageCopilotPanel
        page={page}
        onApply={onApply}
        onRevert={onRevert}
        canRevert={false}
      />
    );

    fireEvent.change(screen.getByLabelText(/copilot prompt/i), {
      target: { value: 'Add a text block' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ask copilot/i }));

    await screen.findByTestId('copilot-suggestion');
    fireEvent.click(screen.getByRole('button', { name: /apply suggestion/i }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Updated page',
        operations: expect.arrayContaining([
          expect.objectContaining({ type: 'set_page_title', title: 'Creator Home' }),
          expect.objectContaining({ type: 'add_widget', widgetType: 'text' }),
        ]),
      })
    );
  });

  it('dismisses only the current suggestion and preserves chat history', async () => {
    const onApply = vi.fn();
    const onRevert = vi.fn();

    render(
      <PageCopilotPanel
        page={page}
        onApply={onApply}
        onRevert={onRevert}
        canRevert={false}
      />
    );

    fireEvent.change(screen.getByLabelText(/copilot prompt/i), {
      target: { value: 'Add a text block' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ask copilot/i }));

    await screen.findByTestId('copilot-suggestion');
    fireEvent.click(screen.getByRole('button', { name: /dismiss suggestion/i }));

    await waitFor(() => {
      expect(screen.queryByText(/set_page_title/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/add a text block/i)).toBeInTheDocument();
    expect(screen.getByText(/updated page/i)).toBeInTheDocument();
  });

  it('calls onRevert when a revert action is available', () => {
    const onApply = vi.fn();
    const onRevert = vi.fn();

    render(
      <PageCopilotPanel
        page={page}
        onApply={onApply}
        onRevert={onRevert}
        canRevert
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /revert ai change/i }));

    expect(onRevert).toHaveBeenCalledTimes(1);
  });
});
