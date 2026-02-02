# Implementation: Phase 4 - Bento Grid Layout

> **Goal**: Implement drag-and-drop bento grid for flexible widget positioning.

## Overview

The bento grid allows users to:
- Position widgets anywhere on a 4-column grid
- Resize widgets (1x1, 2x1, 1x2, 2x2)
- Drag to reorder
- Save layouts to Nostr

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Bento Grid Editor                         │
│  ┌─────────┬─────────┬─────────┬─────────┐                  │
│  │ Profile │ Profile │  Music  │  Music  │                  │
│  │  (2x2)  │  (2x2)  │  (2x1)  │  (2x1)  │                  │
│  ├─────────┼─────────┼─────────┼─────────┤                  │
│  │         │         │ Links   │ Mood    │                  │
│  │         │         │ (1x1)   │ (1x1)   │                  │
│  ├─────────┼─────────┼─────────┼─────────┤                  │
│  │  Top 8  │  Top 8  │ Videos  │ Videos  │                  │
│  │  (2x2)  │  (2x2)  │  (2x2)  │  (2x2)  │                  │
│  ├─────────┼─────────┼─────────┼─────────┤                  │
│  │         │         │         │         │                  │
│  │         │         │         │         │                  │
│  └─────────┴─────────┴─────────┴─────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Task 4.1: Select Grid Library

### Options Evaluation

| Library | Pros | Cons |
|---------|------|------|
| **react-grid-layout** | Mature, widely used, built-in persistence | Heavier bundle |
| **dnd-kit** | Modern, composable, smaller | More setup needed |
| **@hello-pangea/dnd** | Simple API, good docs | Less flexible grid |

### Recommendation: react-grid-layout

**Reasons**:
- Built specifically for dashboard/bento layouts
- Drag, drop, and resize built-in
- Grid-aware collision detection
- Responsive breakpoints
- Persistence helpers

### Installation

```bash
npm install react-grid-layout
npm install -D @types/react-grid-layout
```

---

## Task 4.2: Define Widget System

### Widget Types

```typescript
// src/types/widgets.ts
export interface Widget {
  id: string;
  type: WidgetType;
  x: number;      // Grid column (0-3)
  y: number;      // Grid row
  w: number;      // Width in columns (1-4)
  h: number;      // Height in rows (1-4)
  minW?: number;  // Minimum width
  minH?: number;  // Minimum height
  maxW?: number;  // Maximum width
  maxH?: number;  // Maximum height
  config?: WidgetConfig;
}

export type WidgetType =
  | 'profile'      // Name, avatar, bio
  | 'top8'         // Top 8 friends
  | 'music'        // Music player
  | 'links'        // Link list
  | 'videos'       // Video grid
  | 'mood'         // Mood/status
  | 'gallery'      // Image gallery
  | 'notes'        // Recent notes
  | 'embed'        // Custom embed (YouTube, etc.)
  | 'text'         // Custom text block
  | 'spacer';      // Empty spacer

export interface WidgetConfig {
  // Widget-specific configuration
  [key: string]: unknown;
}
```

### Widget Registry

```typescript
// src/lib/widgetRegistry.ts
import { ProfileWidget } from '@/components/widgets/ProfileWidget';
import { Top8Widget } from '@/components/widgets/Top8Widget';
import { MusicWidget } from '@/components/widgets/MusicWidget';
// ... other imports

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  icon: React.ComponentType;
  component: React.ComponentType<WidgetProps>;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
}

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  profile: {
    type: 'profile',
    name: 'Profile',
    icon: UserIcon,
    component: ProfileWidget,
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
  },
  top8: {
    type: 'top8',
    name: 'Top 8 Friends',
    icon: UsersIcon,
    component: Top8Widget,
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  music: {
    type: 'music',
    name: 'Music Player',
    icon: MusicIcon,
    component: MusicWidget,
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
  },
  links: {
    type: 'links',
    name: 'Links',
    icon: LinkIcon,
    component: LinksWidget,
    defaultSize: { w: 1, h: 2 },
    minSize: { w: 1, h: 1 },
  },
  videos: {
    type: 'videos',
    name: 'Videos',
    icon: VideoIcon,
    component: VideosWidget,
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  mood: {
    type: 'mood',
    name: 'Mood',
    icon: SmileIcon,
    component: MoodWidget,
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  // ... other widgets
};
```

---

## Task 4.3: Implement Core Widgets

### Widget Base Component

```typescript
// src/components/widgets/WidgetWrapper.tsx
interface WidgetWrapperProps {
  widget: Widget;
  isEditing: boolean;
  children: React.ReactNode;
}

export function WidgetWrapper({ widget, isEditing, children }: WidgetWrapperProps) {
  const definition = widgetRegistry[widget.type];

  return (
    <Card className={cn(
      'widget h-full overflow-hidden',
      isEditing && 'ring-2 ring-primary/50 cursor-move'
    )}>
      {isEditing && (
        <div className="widget-toolbar absolute top-2 right-2 z-10">
          <Button size="icon" variant="ghost">
            <SettingsIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      <CardContent className="p-4 h-full">
        {children}
      </CardContent>
    </Card>
  );
}
```

### Profile Widget

```typescript
// src/components/widgets/ProfileWidget.tsx
interface ProfileWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function ProfileWidget({ widget, pubkey, isEditing }: ProfileWidgetProps) {
  const { data: author } = useAuthor(pubkey);
  const metadata = author?.metadata;

  return (
    <WidgetWrapper widget={widget} isEditing={isEditing}>
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={metadata?.picture} />
          <AvatarFallback>{metadata?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-bold">{metadata?.display_name || metadata?.name}</h2>
          {metadata?.nip05 && (
            <p className="text-sm text-muted-foreground">{metadata.nip05}</p>
          )}
        </div>
        {widget.h >= 2 && metadata?.about && (
          <p className="text-sm text-center line-clamp-3">{metadata.about}</p>
        )}
      </div>
    </WidgetWrapper>
  );
}
```

### Top 8 Widget

```typescript
// src/components/widgets/Top8Widget.tsx
export function Top8Widget({ widget, pubkey, isEditing }: WidgetProps) {
  const { friends } = useTop8Friends(pubkey);

  return (
    <WidgetWrapper widget={widget} isEditing={isEditing}>
      <h3 className="font-bold mb-4">Top 8 Friends</h3>
      <div className="grid grid-cols-4 gap-2">
        {friends.slice(0, 8).map((friend, index) => (
          <FriendCard
            key={friend.pubkey}
            friend={friend}
            rank={index + 1}
          />
        ))}
      </div>
    </WidgetWrapper>
  );
}
```

---

## Task 4.4: Create Grid Editor

### Main Grid Component

```typescript
// src/components/BentoGrid/BentoGridEditor.tsx
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface BentoGridEditorProps {
  widgets: Widget[];
  onLayoutChange: (widgets: Widget[]) => void;
  isEditing: boolean;
  pubkey: string;
}

export function BentoGridEditor({
  widgets,
  onLayoutChange,
  isEditing,
  pubkey,
}: BentoGridEditorProps) {
  const layout: Layout[] = widgets.map(w => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: w.minW,
    minH: w.minH,
    maxW: w.maxW,
    maxH: w.maxH,
    static: !isEditing,
  }));

  const handleLayoutChange = (newLayout: Layout[]) => {
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(l => l.i === widget.id);
      if (!layoutItem) return widget;
      return {
        ...widget,
        x: layoutItem.x,
        y: layoutItem.y,
        w: layoutItem.w,
        h: layoutItem.h,
      };
    });
    onLayoutChange(updatedWidgets);
  };

  return (
    <GridLayout
      className="bento-grid"
      layout={layout}
      cols={4}
      rowHeight={150}
      width={1200}
      onLayoutChange={handleLayoutChange}
      isDraggable={isEditing}
      isResizable={isEditing}
      compactType="vertical"
      preventCollision={false}
    >
      {widgets.map(widget => (
        <div key={widget.id}>
          <WidgetRenderer
            widget={widget}
            pubkey={pubkey}
            isEditing={isEditing}
          />
        </div>
      ))}
    </GridLayout>
  );
}
```

### Widget Renderer

```typescript
// src/components/BentoGrid/WidgetRenderer.tsx
export function WidgetRenderer({ widget, pubkey, isEditing }: WidgetRendererProps) {
  const definition = widgetRegistry[widget.type];

  if (!definition) {
    return <div>Unknown widget type: {widget.type}</div>;
  }

  const Component = definition.component;
  return <Component widget={widget} pubkey={pubkey} isEditing={isEditing} />;
}
```

### Widget Palette (Add New Widgets)

```typescript
// src/components/BentoGrid/WidgetPalette.tsx
export function WidgetPalette({ onAddWidget }: { onAddWidget: (type: WidgetType) => void }) {
  return (
    <div className="widget-palette">
      <h3 className="font-bold mb-4">Add Widget</h3>
      <div className="grid grid-cols-3 gap-2">
        {Object.values(widgetRegistry).map(definition => (
          <Button
            key={definition.type}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => onAddWidget(definition.type)}
          >
            <definition.icon className="h-6 w-6 mb-2" />
            <span className="text-xs">{definition.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 4.5: Persist Layout to Nostr

### Layout Schema

```typescript
// Stored in Kind 30512 content
interface SiteContent {
  layout: {
    type: 'bento';
    gridCols: number;
    widgets: Widget[];
  };
  customization?: ThemeCustomization;
}
```

### Save/Load Hooks

```typescript
// src/hooks/useBentoLayout.ts
export function useBentoLayout(pubkey: string) {
  const { data: siteConfig, updateSite } = useSiteConfig(pubkey);
  const queryClient = useQueryClient();

  const widgets = useMemo(() => {
    if (!siteConfig?.content) return defaultLayout;
    try {
      const content = JSON.parse(siteConfig.content);
      return content.layout?.widgets ?? defaultLayout;
    } catch {
      return defaultLayout;
    }
  }, [siteConfig]);

  const saveLayout = useCallback(async (newWidgets: Widget[]) => {
    const content = siteConfig?.content ? JSON.parse(siteConfig.content) : {};
    content.layout = {
      type: 'bento',
      gridCols: 4,
      widgets: newWidgets,
    };

    await updateSite({
      content: JSON.stringify(content),
    });

    queryClient.invalidateQueries({ queryKey: ['site-config', pubkey] });
  }, [siteConfig, updateSite, pubkey, queryClient]);

  return {
    widgets,
    saveLayout,
  };
}
```

### Default Layout

```typescript
// src/lib/defaultLayout.ts
export const defaultLayout: Widget[] = [
  { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
  { id: 'music', type: 'music', x: 2, y: 0, w: 2, h: 1 },
  { id: 'mood', type: 'mood', x: 2, y: 1, w: 1, h: 1 },
  { id: 'links', type: 'links', x: 3, y: 1, w: 1, h: 1 },
  { id: 'top8', type: 'top8', x: 0, y: 2, w: 2, h: 2 },
  { id: 'videos', type: 'videos', x: 2, y: 2, w: 2, h: 2 },
];
```

---

## Task 4.6: Layout Templates

### Template System

```typescript
// src/lib/layoutTemplates.ts
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  widgets: Widget[];
}

export const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'classic',
    name: 'Classic MySpace',
    description: 'Traditional two-column layout',
    thumbnail: '/templates/classic.png',
    widgets: [
      { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 3 },
      { id: 'top8', type: 'top8', x: 0, y: 3, w: 2, h: 2 },
      { id: 'music', type: 'music', x: 2, y: 0, w: 2, h: 1 },
      { id: 'mood', type: 'mood', x: 2, y: 1, w: 2, h: 1 },
      { id: 'videos', type: 'videos', x: 2, y: 2, w: 2, h: 3 },
    ],
  },
  {
    id: 'bento',
    name: 'Bento Grid',
    description: 'Modern asymmetric grid',
    thumbnail: '/templates/bento.png',
    widgets: [/* ... */],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple',
    thumbnail: '/templates/minimal.png',
    widgets: [
      { id: 'profile', type: 'profile', x: 0, y: 0, w: 4, h: 2 },
      { id: 'links', type: 'links', x: 0, y: 2, w: 4, h: 1 },
    ],
  },
  {
    id: 'maximal',
    name: 'Maximalist',
    description: 'All the widgets!',
    thumbnail: '/templates/maximal.png',
    widgets: [/* all widgets */],
  },
];
```

### Template Selector

```typescript
// src/components/LayoutTemplateSelector.tsx
export function LayoutTemplateSelector({
  onSelect,
}: {
  onSelect: (template: LayoutTemplate) => void;
}) {
  return (
    <div className="template-selector">
      <h3 className="font-bold mb-4">Choose a Layout</h3>
      <div className="grid grid-cols-2 gap-4">
        {layoutTemplates.map(template => (
          <Card
            key={template.id}
            className="cursor-pointer hover:ring-2 hover:ring-primary"
            onClick={() => onSelect(template)}
          >
            <img src={template.thumbnail} alt={template.name} />
            <CardContent className="p-4">
              <h4 className="font-bold">{template.name}</h4>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Responsive Design

### Breakpoints

```typescript
// src/components/BentoGrid/ResponsiveBentoGrid.tsx
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 4, md: 4, sm: 2, xs: 2, xxs: 1 };

export function ResponsiveBentoGrid({ widgets, ...props }: Props) {
  const layouts = {
    lg: widgetsToLayout(widgets),
    md: widgetsToLayout(widgets),
    sm: widgetsToMobileLayout(widgets),
    xs: widgetsToMobileLayout(widgets),
    xxs: widgetsToStackedLayout(widgets),
  };

  return (
    <ResponsiveGridLayout
      className="bento-grid"
      layouts={layouts}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={150}
      {...props}
    >
      {/* widgets */}
    </ResponsiveGridLayout>
  );
}
```

---

## Testing Strategy

### Unit Tests
- Widget rendering
- Layout serialization
- Template application

### Integration Tests
- Drag and drop
- Resize behavior
- Save/load cycle

### Visual Tests
- Screenshot comparisons
- Responsive breakpoints

---

## Acceptance Criteria

- [ ] Users can drag widgets to reposition
- [ ] Users can resize widgets
- [ ] Widgets snap to grid
- [ ] Layouts persist to Nostr
- [ ] Layouts render correctly for visitors
- [ ] Mobile responsive (collapses to 1-2 cols)
- [ ] Layout templates available
- [ ] All tests pass
