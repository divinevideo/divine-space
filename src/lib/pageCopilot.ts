import { createWidget, isWidgetType } from '@/types/widgets';
import { getWidgetDefinition } from '@/lib/widgetRegistry';
import type { PageDocument } from '@/types/page';
import type {
  PageCopilotOperation,
  PageCopilotProposalItem,
  PageCopilotPromptContext,
  PageCopilotSuggestion,
} from '@/types/pageCopilot';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSize(value: unknown): value is { w: number; h: number } {
  return (
    isObject(value) &&
    typeof value.w === 'number' &&
    typeof value.h === 'number'
  );
}

function isPosition(value: unknown): value is { x: number; y: number } {
  return (
    isObject(value) &&
    typeof value.x === 'number' &&
    typeof value.y === 'number'
  );
}

function isWidgetUpdates(
  value: unknown
): value is Partial<Record<'x' | 'y' | 'w' | 'h' | 'config', unknown>> {
  if (!isObject(value)) {
    return false;
  }

  const allowedKeys = new Set(['x', 'y', 'w', 'h', 'config']);
  const keys = Object.keys(value);

  if (keys.length === 0 || keys.some((key) => !allowedKeys.has(key))) {
    return false;
  }

  if ('x' in value && typeof value.x !== 'number') return false;
  if ('y' in value && typeof value.y !== 'number') return false;
  if ('w' in value && typeof value.w !== 'number') return false;
  if ('h' in value && typeof value.h !== 'number') return false;
  if ('config' in value && value.config !== undefined && !isObject(value.config)) return false;

  return true;
}

export function isPageCopilotOperation(value: unknown): value is PageCopilotOperation {
  if (!isObject(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'set_page_title':
      return typeof value.title === 'string';
    case 'set_page_summary':
      return typeof value.summary === 'string';
    case 'add_widget':
      return (
        typeof value.widgetType === 'string' &&
        isWidgetType(value.widgetType) &&
        (!('position' in value) || value.position === undefined || isPosition(value.position)) &&
        (!('size' in value) || value.size === undefined || isSize(value.size)) &&
        (!('config' in value) || value.config === undefined || isObject(value.config))
      );
    case 'update_widget':
      return (
        typeof value.widgetId === 'string' &&
        isWidgetUpdates(value.updates)
      );
    case 'remove_widget':
      return typeof value.widgetId === 'string';
    default:
      return false;
  }
}

export function buildPageCopilotContext(page: PageDocument): string {
  const context: PageCopilotPromptContext = {
    title: page.title,
    summary: page.summary,
    widgets: page.widgets.map((widget) => ({
      id: widget.id,
      type: widget.type,
    })),
  };

  return [
    `title: ${context.title ?? ''}`,
    `summary: ${context.summary ?? ''}`,
    'widgets:',
    ...context.widgets.map((widget) => `- ${widget.id}: ${widget.type}`),
  ].join('\n');
}

export function parsePageCopilotSuggestion(raw: string): PageCopilotSuggestion {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid copilot suggestion payload');
  }

  if (!isObject(parsed) || typeof parsed.message !== 'string' || !Array.isArray(parsed.operations)) {
    throw new Error('Invalid copilot suggestion payload');
  }

  const operations = parsed.operations.filter(isPageCopilotOperation);
  if (operations.length !== parsed.operations.length) {
    throw new Error('Invalid copilot suggestion payload');
  }

  return {
    message: parsed.message,
    operations,
  };
}

function getOperationId(operation: PageCopilotOperation, index: number): string {
  return `${operation.type}-${index}`;
}

function getWidgetLabel(page: PageDocument, widgetId: string): string {
  const widget = page.widgets.find((candidate) => candidate.id === widgetId);
  if (!widget) {
    return 'widget';
  }

  return getWidgetDefinition(widget.type).name;
}

function summarizePageOperation(page: PageDocument, operation: PageCopilotOperation): string {
  switch (operation.type) {
    case 'set_page_title':
      return `Rename page title to "${operation.title}"`;
    case 'set_page_summary':
      return `Update page summary to "${operation.summary}"`;
    case 'add_widget':
      return `Add ${getWidgetDefinition(operation.widgetType).name} widget`;
    case 'update_widget':
      return `Update ${getWidgetLabel(page, operation.widgetId)}`;
    case 'remove_widget':
      return `Remove ${getWidgetLabel(page, operation.widgetId)}`;
  }
}

export function buildProposalItems(
  page: PageDocument,
  suggestion: PageCopilotSuggestion
): PageCopilotProposalItem[] {
  return suggestion.operations.map((operation, index) => ({
    operationId: getOperationId(operation, index),
    label: summarizePageOperation(page, operation),
    operation,
  }));
}

export function filterSuggestionOperations(
  suggestion: PageCopilotSuggestion,
  selectedOperationIds: Set<string>
): PageCopilotSuggestion {
  return {
    ...suggestion,
    operations: suggestion.operations.filter((operation, index) =>
      selectedOperationIds.has(getOperationId(operation, index))
    ),
  };
}

export function applyPageCopilotSuggestion(page: PageDocument, suggestion: PageCopilotSuggestion): PageDocument {
  const nextPage: PageDocument = {
    ...page,
    widgets: page.widgets.map((widget) => ({ ...widget })),
  };

  for (const operation of suggestion.operations) {
    switch (operation.type) {
      case 'set_page_title':
        nextPage.title = operation.title;
        break;
      case 'set_page_summary':
        nextPage.summary = operation.summary;
        break;
      case 'add_widget': {
        const position = operation.position ?? { x: 0, y: nextPage.widgets.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0) };
        const size = operation.size ?? { w: 2, h: 2 };
        nextPage.widgets = [
          ...nextPage.widgets,
          createWidget(operation.widgetType, position, size, operation.config),
        ];
        break;
      }
      case 'update_widget':
        nextPage.widgets = nextPage.widgets.map((widget) =>
          widget.id === operation.widgetId
            ? { ...widget, ...operation.updates }
            : widget
        );
        break;
      case 'remove_widget':
        nextPage.widgets = nextPage.widgets.filter((widget) => widget.id !== operation.widgetId);
        break;
    }
  }

  return nextPage;
}
