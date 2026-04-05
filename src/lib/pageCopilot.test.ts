import { describe, expect, it } from 'vitest';
import type { PageDocument } from '@/types/page';
import {
  applyPageCopilotSuggestion,
  buildProposalItems,
  buildPageCopilotContext,
  filterSuggestionOperations,
  isPageCopilotOperation,
  parsePageCopilotSuggestion,
} from './pageCopilot';

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

describe('isPageCopilotOperation', () => {
  it('accepts a supported title update operation', () => {
    expect(isPageCopilotOperation({ type: 'set_page_title', title: 'Creator page' })).toBe(true);
  });

  it('rejects add_widget operations with unsupported widget types', () => {
    expect(isPageCopilotOperation({ type: 'add_widget', widgetType: 'quote' })).toBe(false);
  });

  it('rejects update_widget operations with unsupported update keys', () => {
    expect(
      isPageCopilotOperation({
        type: 'update_widget',
        widgetId: 'profile-1',
        updates: { type: 'links' },
      })
    ).toBe(false);
  });

  it('rejects an unsupported operation', () => {
    expect(isPageCopilotOperation({ type: 'launch_missiles' })).toBe(false);
  });
});

describe('pageCopilot helpers', () => {
  it('builds compact prompt context from the current draft', () => {
    const context = buildPageCopilotContext(page);

    expect(context).toContain('title: My Page');
    expect(context).toContain('- profile-1: profile');
    expect(context).toContain('- links-1: links');
  });

  it('applies supported operations to the page draft', () => {
    const nextPage = applyPageCopilotSuggestion(page, {
      message: 'Updated page',
      operations: [{ type: 'set_page_title', title: 'New Title' }],
    });

    expect(nextPage.title).toBe('New Title');
  });

  it('builds readable proposal items from a suggestion', () => {
    const items = buildProposalItems(page, {
      message: 'Updated page',
      operations: [
        { type: 'set_page_title', title: 'Creator Home' },
        { type: 'add_widget', widgetType: 'text' },
      ],
    });

    expect(items).toHaveLength(2);
    expect(items[0].label).toMatch(/rename page title/i);
    expect(items[0].operationId).toBe('set_page_title-0');
    expect(items[1].label).toMatch(/add text block widget/i);
  });

  it('filters a suggestion down to selected operation ids', () => {
    const suggestion = {
      message: 'Updated page',
      operations: [
        { type: 'set_page_title', title: 'Creator Home' },
        { type: 'add_widget', widgetType: 'text' },
      ],
    } satisfies Parameters<typeof buildProposalItems>[1];

    const filtered = filterSuggestionOperations(
      suggestion,
      new Set(['add_widget-1'])
    );

    expect(filtered.operations).toEqual([
      { type: 'add_widget', widgetType: 'text' },
    ]);
  });

  it('throws on malformed AI payload', () => {
    expect(() => parsePageCopilotSuggestion('not json')).toThrow(/invalid/i);
  });

  it('rejects add_widget operations with unsupported widget types', () => {
    expect(() =>
      parsePageCopilotSuggestion(
        JSON.stringify({
          message: 'Bad widget',
          operations: [{ type: 'add_widget', widgetType: 'quote' }],
        })
      )
    ).toThrow(/invalid/i);
  });
});
