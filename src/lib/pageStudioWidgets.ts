import { createWidget, type Widget, type WidgetType } from '@/types/widgets';
import { canAddWidget, getDefaultSize } from '@/lib/widgetRegistry';

export function appendWidgetToLayout(widgets: Widget[], type: WidgetType): Widget[] {
  if (!canAddWidget(type, widgets)) {
    return widgets;
  }

  const defaultSize = getDefaultSize(type);
  const maxY = widgets.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0);
  const newWidget = createWidget(type, { x: 0, y: maxY }, defaultSize);

  return [...widgets, newWidget];
}
