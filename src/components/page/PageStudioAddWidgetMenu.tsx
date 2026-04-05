import { useState, type ComponentType } from 'react';
import { Plus, User, Users, Music, Link, Video, Smile, Image, MessageSquare, ExternalLink, Type, Square, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { createWidget } from '@/types/widgets';
import type { Widget, WidgetType } from '@/types/widgets';
import {
  canAddWidget,
  getAllWidgetDefinitions,
  getDefaultSize,
} from '@/lib/widgetRegistry';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  User,
  Users,
  Music,
  Link,
  Video,
  Smile,
  Image,
  MessageSquare,
  ExternalLink,
  Type,
  Square,
  Calendar,
};

function getIconComponent(iconName: string): ComponentType<{ className?: string }> {
  return iconMap[iconName] || Square;
}

export function appendWidgetToLayout(widgets: Widget[], type: WidgetType): Widget[] {
  if (!canAddWidget(type, widgets)) {
    return widgets;
  }

  const defaultSize = getDefaultSize(type);
  const maxY = widgets.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0);
  const newWidget = createWidget(type, { x: 0, y: maxY }, defaultSize);

  return [...widgets, newWidget];
}

export interface PageStudioAddWidgetMenuProps {
  widgets: Widget[];
  onAddWidget: (type: WidgetType) => void;
  className?: string;
}

export function PageStudioAddWidgetMenu({
  widgets,
  onAddWidget,
  className,
}: PageStudioAddWidgetMenuProps) {
  const [open, setOpen] = useState(false);
  const allWidgetDefinitions = getAllWidgetDefinitions();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn('gap-2', className)}>
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-2">
          <h4 className="mb-3 text-sm font-medium">Choose a widget to add</h4>
          <div className="grid grid-cols-2 gap-2">
            {allWidgetDefinitions.map((definition) => {
              const canAdd = canAddWidget(definition.type, widgets);
              const IconComponent = getIconComponent(definition.icon);

              return (
                <button
                  key={definition.type}
                  type="button"
                  data-testid={`add-widget-${definition.type}`}
                  disabled={!canAdd}
                  onClick={() => {
                    if (!canAdd) {
                      return;
                    }

                    onAddWidget(definition.type);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors',
                    canAdd
                      ? 'cursor-pointer hover:bg-accent'
                      : 'cursor-not-allowed opacity-50'
                  )}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{definition.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default PageStudioAddWidgetMenu;
