import type { Widget, WidgetConfig, WidgetType } from '@/types/widgets';

export type PageCopilotOperation =
  | { type: 'set_page_title'; title: string }
  | { type: 'set_page_summary'; summary: string }
  | {
      type: 'add_widget';
      widgetType: WidgetType;
      position?: { x: number; y: number };
      size?: { w: number; h: number };
      config?: WidgetConfig;
    }
  | {
      type: 'update_widget';
      widgetId: string;
      updates: Partial<Pick<Widget, 'x' | 'y' | 'w' | 'h' | 'config'>>;
    }
  | { type: 'remove_widget'; widgetId: string };

export interface PageCopilotSuggestion {
  message: string;
  operations: PageCopilotOperation[];
}

export interface PageCopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface PageCopilotPromptContext {
  title?: string;
  summary?: string;
  widgetTypes: WidgetType[];
}
