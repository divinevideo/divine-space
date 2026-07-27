/**
 * BentoGrid - A CSS Grid-based layout component for rendering widgets.
 *
 * Renders widgets in a responsive grid layout based on BentoLayout configuration.
 * Each widget is positioned according to its x, y coordinates and sized by w, h values.
 */

import type { BentoLayout, Widget, WidgetType } from '@/types/widgets';
import { ProfileWidget } from '@/components/widgets/ProfileWidget';
import { Top8Widget } from '@/components/widgets/Top8Widget';
import { MusicWidget } from '@/components/widgets/MusicWidget';
import { LinksWidget } from '@/components/widgets/LinksWidget';
import { MoodWidget } from '@/components/widgets/MoodWidget';
import { VideosWidget } from '@/components/widgets/VideosWidget';
import { NotesWidget } from '@/components/widgets/NotesWidget';
import { EventsWidget } from '@/components/widgets/EventsWidget';
import { EmbedWidget } from '@/components/widgets/EmbedWidget';
import { TextWidget } from '@/components/widgets/TextWidget';
import { BlurbsWidget } from '@/components/widgets/BlurbsWidget';
import { ContactActionsWidget } from '@/components/widgets/ContactActionsWidget';
import { ProfileDetailsWidget } from '@/components/widgets/ProfileDetailsWidget';
import { ExtendedNetworkWidget } from '@/components/widgets/ExtendedNetworkWidget';

/**
 * Props for the BentoGrid component.
 */
export interface BentoGridProps {
  /** The layout configuration containing widget definitions */
  layout: BentoLayout;
  /** The pubkey of the profile being viewed */
  pubkey: string;
  /** Whether the grid is in editing mode */
  isEditing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface BentoGridWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing?: boolean;
}

/**
 * Map of widget types to their corresponding components.
 * Only includes implemented widgets.
 */
const WIDGET_COMPONENTS: Partial<Record<WidgetType, React.ComponentType<{ widget: Widget; pubkey: string; isEditing: boolean }>>> = {
  profile: ProfileWidget,
  top8: Top8Widget,
  music: MusicWidget,
  links: LinksWidget,
  mood: MoodWidget,
  videos: VideosWidget,
  notes: NotesWidget,
  events: EventsWidget,
  embed: EmbedWidget,
  text: TextWidget,
  blurbs: BlurbsWidget,
  'contact-actions': ContactActionsWidget,
  'profile-details': ProfileDetailsWidget,
  'extended-network': ExtendedNetworkWidget,
};

/**
 * Placeholder component for widgets that haven't been implemented yet.
 */
function PlaceholderWidget({ widget }: { widget: Widget }) {
  return (
    <div
      data-testid="placeholder-widget"
      className="h-full w-full rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center"
    >
      <span className="text-muted-foreground text-sm">{widget.type}</span>
    </div>
  );
}

export function BentoGridWidget({ widget, pubkey, isEditing = false }: BentoGridWidgetProps) {
  const WidgetComponent = WIDGET_COMPONENTS[widget.type];

  if (WidgetComponent) {
    return <WidgetComponent widget={widget} pubkey={pubkey} isEditing={isEditing} />;
  }

  return <PlaceholderWidget widget={widget} />;
}

/**
 * BentoGrid renders widgets in a CSS Grid layout.
 *
 * Features:
 * - Positions widgets according to their x, y coordinates (0-indexed)
 * - Sizes widgets according to their w (width) and h (height) values
 * - Renders appropriate widget component for each type
 * - Falls back to placeholder for unimplemented widget types
 * - Passes isEditing prop to all widgets for edit mode support
 */
export function BentoGrid({ layout, pubkey, isEditing = false, className }: BentoGridProps) {
  const { gridCols, rowHeight, widgets } = layout;

  return (
    <div
      data-testid="bento-grid"
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: `${rowHeight}px`,
        gap: '1rem',
      }}
    >
      {widgets.map((widget) => {
        return (
          <div
            key={widget.id}
            style={{
              gridColumn: `${widget.x + 1} / span ${widget.w}`,
              gridRow: `${widget.y + 1} / span ${widget.h}`,
            }}
          >
            <BentoGridWidget widget={widget} pubkey={pubkey} isEditing={isEditing} />
          </div>
        );
      })}
    </div>
  );
}

export default BentoGrid;
