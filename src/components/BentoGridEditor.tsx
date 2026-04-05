import { useMemo, useCallback, type ComponentType } from 'react';
import GridLayout, {
  WidthProvider as RGLWidthProvider,
  type Layout as GridLayoutItems,
} from 'react-grid-layout/legacy';
import { X, User, Users, Music, Link, Video, Smile, Image, MessageSquare, ExternalLink, Type, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BentoLayout, Widget } from '@/types/widgets';
import { BentoGridWidget } from '@/components/BentoGrid';
import { getMinSize, getMaxSize, widgetRegistry } from '@/lib/widgetRegistry';

import 'react-grid-layout/css/styles.css';

// Create a responsive grid layout with automatic width handling
const ResponsiveGridLayout = RGLWidthProvider(GridLayout);

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
};

function getIconComponent(iconName: string): ComponentType<{ className?: string }> {
  return iconMap[iconName] || Square;
}

interface BentoGridEditorProps {
  /** The current bento layout */
  layout: BentoLayout;
  /** The pubkey of the profile being edited */
  pubkey: string;
  /** Callback when the layout changes */
  onChange: (layout: BentoLayout) => void;
  /** Optional class name */
  className?: string;
}

/**
 * BentoGridEditor provides a drag-and-drop interface for editing bento grid layouts.
 * Uses react-grid-layout for drag, drop, and resize functionality.
 */
export function BentoGridEditor({
  layout,
  pubkey,
  onChange,
  className,
}: BentoGridEditorProps) {
  // Convert widgets to react-grid-layout format with constraints
  const gridLayout: GridLayoutItems = useMemo(() => {
    return layout.widgets.map((widget) => {
      const minSize = getMinSize(widget.type);
      const maxSize = getMaxSize(widget.type);
      return {
        i: widget.id,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
        minW: minSize.w,
        minH: minSize.h,
        maxW: maxSize.w,
        maxH: maxSize.h,
      };
    });
  }, [layout.widgets]);

  // Handle layout change from react-grid-layout
  const handleLayoutChange = useCallback(
    (newGridLayout: GridLayoutItems) => {
      const updatedWidgets = layout.widgets.map((widget) => {
        const gridItem = newGridLayout.find((item) => item.i === widget.id);
        if (gridItem) {
          return {
            ...widget,
            x: gridItem.x,
            y: gridItem.y,
            w: gridItem.w,
            h: gridItem.h,
          };
        }
        return widget;
      });

      onChange({
        ...layout,
        widgets: updatedWidgets,
      });
    },
    [layout, onChange]
  );

  // Remove a widget from the layout
  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      onChange({
        ...layout,
        widgets: layout.widgets.filter((w) => w.id !== widgetId),
      });
    },
    [layout, onChange]
  );

  return (
    <div className={cn('bento-grid-editor', className)}>
      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layout={gridLayout}
        cols={layout.gridCols}
        rowHeight={layout.rowHeight}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        isResizable={true}
        isDraggable={true}
        margin={[16, 16] as [number, number]}
        containerPadding={[0, 0] as [number, number]}
      >
        {layout.widgets.map((widget) => (
          <div
            key={widget.id}
            data-testid={`widget-${widget.id}`}
            className="relative"
          >
            <WidgetEditorItem
              widget={widget}
              pubkey={pubkey}
              onRemove={() => handleRemoveWidget(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Empty state */}
      {layout.widgets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">No widgets yet</p>
          <p className="text-sm">Use the top bar to add a widget</p>
        </div>
      )}
    </div>
  );
}

interface WidgetEditorItemProps {
  widget: Widget;
  pubkey: string;
  onRemove: () => void;
}

/**
 * Individual widget item in the editor with controls for editing and deletion.
 */
function WidgetEditorItem({ widget, pubkey, onRemove }: WidgetEditorItemProps) {
  const definition = widgetRegistry[widget.type];
  const IconComponent = getIconComponent(definition.icon);

  return (
    <Card className="h-full overflow-hidden group">
      {/* Widget Header with drag handle and delete button */}
      <div className="drag-handle flex items-center justify-between px-3 py-2 bg-muted/50 border-b cursor-move">
        <div className="flex items-center gap-2 text-sm font-medium">
          <IconComponent className="h-4 w-4" />
          <span>{definition.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          data-testid={`delete-widget-${widget.id}`}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove {definition.name}</span>
        </Button>
      </div>

      <CardContent className="h-[calc(100%-40px)] overflow-hidden p-3">
        <div className="pointer-events-none h-full">
          <BentoGridWidget widget={widget} pubkey={pubkey} />
        </div>
      </CardContent>
    </Card>
  );
}

export default BentoGridEditor;
