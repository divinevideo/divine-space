import type { BentoLayout, Widget } from '@/types/widgets';

export const sidebarBentoDefaultWidgets: Widget[] = [
  {
    id: 'profile',
    type: 'profile',
    x: 0,
    y: 0,
    w: 1,
    h: 2,
  },
  {
    id: 'links',
    type: 'links',
    x: 0,
    y: 2,
    w: 1,
    h: 2,
  },
  {
    id: 'music',
    type: 'music',
    x: 1,
    y: 0,
    w: 3,
    h: 1,
  },
  {
    id: 'top8',
    type: 'top8',
    x: 1,
    y: 1,
    w: 3,
    h: 3,
  },
];

export const sidebarBentoDefaultLayout: BentoLayout = {
  type: 'bento',
  gridCols: 4,
  rowHeight: 150,
  widgets: sidebarBentoDefaultWidgets,
};

function createWidgetId(type: string) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cloneSidebarBentoWidgets(widgets: Widget[]): Widget[] {
  return widgets.map((widget) => ({
    ...widget,
    id: createWidgetId(widget.type),
  }));
}

export function createSidebarBentoWidgets(): Widget[] {
  return cloneSidebarBentoWidgets(sidebarBentoDefaultWidgets);
}

export function createSidebarBentoLayout(
  widgets: Widget[] = createSidebarBentoWidgets(),
  gridCols = 4,
  rowHeight = 150
): BentoLayout {
  return {
    type: 'bento',
    gridCols,
    rowHeight,
    widgets,
  };
}
