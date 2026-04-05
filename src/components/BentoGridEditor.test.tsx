import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { BentoGridEditor } from './BentoGridEditor';
import { PageStudioAddWidgetMenu } from '@/components/page/PageStudioAddWidgetMenu';
import { appendWidgetToLayout } from '@/lib/pageStudioWidgets';
import type { BentoLayout } from '@/types/widgets';

vi.mock('@/components/widgets/ProfileWidget', () => ({
  ProfileWidget: () => <div data-testid="profile-widget">ProfileWidget</div>,
}));

vi.mock('@/components/widgets/Top8Widget', () => ({
  Top8Widget: () => <div data-testid="top8-widget">Top8Widget</div>,
}));

// Mock react-grid-layout since it requires a DOM environment
// Note: The component uses require() so the mock needs to work with CJS interop
vi.mock('react-grid-layout/legacy', async () => {
  const MockGridLayout = ({ children, onLayoutChange, layout }: {
    children?: React.ReactNode;
    onLayoutChange?: (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => void;
    layout?: Array<{ i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number }>;
  }) => (
    <div data-testid="react-grid-layout" data-layout={JSON.stringify(layout)}>
      {children}
      <button
        data-testid="simulate-layout-change"
        onClick={() => onLayoutChange?.([
          { i: 'profile-1', x: 1, y: 0, w: 2, h: 2 },
        ])}
      >
        Simulate Layout Change
      </button>
    </div>
  );

  const MockWidthProvider = <T,>(Component: T) => Component;

  // Return both ESM and CJS compatible exports
  const mockModule = {
    default: MockGridLayout,
    WidthProvider: MockWidthProvider,
  };

  return {
    ...mockModule,
    __esModule: true,
  };
});

describe('BentoGridEditor', () => {
  const mockPubkey = 'test-pubkey-123';

  const defaultLayout: BentoLayout = {
    type: 'bento',
    gridCols: 4,
    rowHeight: 100,
    widgets: [],
  };

  const layoutWithWidgets: BentoLayout = {
    type: 'bento',
    gridCols: 4,
    rowHeight: 100,
    widgets: [
      { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      { id: 'top8-1', type: 'top8', x: 2, y: 0, w: 2, h: 2 },
    ],
  };

  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  it('renders the editor', () => {
    render(
      <TestApp>
        <BentoGridEditor
          layout={defaultLayout}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    // Should render the grid layout container
    expect(screen.getByTestId('react-grid-layout')).toBeInTheDocument();
  });

  it('renders widgets in the layout', () => {
    render(
      <TestApp>
        <BentoGridEditor
          layout={layoutWithWidgets}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    // Should render widget containers for each widget
    expect(screen.getByTestId('widget-profile-1')).toBeInTheDocument();
    expect(screen.getByTestId('widget-top8-1')).toBeInTheDocument();
  });

  it('renders the actual widget preview while editing', () => {
    render(
      <TestApp>
        <BentoGridEditor
          layout={layoutWithWidgets}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    expect(screen.getByTestId('profile-widget')).toBeInTheDocument();
    expect(screen.getByTestId('top8-widget')).toBeInTheDocument();
  });

  it('calls onChange when layout changes', () => {
    render(
      <TestApp>
        <BentoGridEditor
          layout={layoutWithWidgets}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    // Simulate a layout change from react-grid-layout
    fireEvent.click(screen.getByTestId('simulate-layout-change'));

    // onChange should be called with updated layout
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('does not own the add widget toolbar', () => {
    render(
      <TestApp>
        <BentoGridEditor
          layout={defaultLayout}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    expect(screen.queryByTestId('widget-toolbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add widget/i })).not.toBeInTheDocument();
  });

  it('appends a new widget to the layout using the shared helper', () => {
    const nextWidgets = appendWidgetToLayout(defaultLayout.widgets, 'profile');

    expect(nextWidgets).toHaveLength(1);
    expect(nextWidgets[0].type).toBe('profile');
    expect(nextWidgets[0].x).toBe(0);
    expect(nextWidgets[0].y).toBe(0);
    expect(nextWidgets[0].w).toBe(2);
    expect(nextWidgets[0].h).toBe(2);
  });

  it('forwards selected widget types from the top bar menu', () => {
    const onAddWidget = vi.fn();

    render(
      <TestApp>
        <PageStudioAddWidgetMenu widgets={defaultLayout.widgets} onAddWidget={onAddWidget} />
      </TestApp>
    );

    const addButton = screen.getByRole('button', { name: /add widget/i });
    fireEvent.click(addButton);

    const profileOption = screen.getByTestId('add-widget-profile');
    expect(profileOption).toBeInTheDocument();

    fireEvent.click(profileOption);

    expect(onAddWidget).toHaveBeenCalledWith('profile');
  });

  it('removes a widget when clicking delete button', () => {
    render(
      <TestApp>
        <BentoGridEditor
          layout={layoutWithWidgets}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    // Find and click delete button for the profile widget
    const deleteButton = screen.getByTestId('delete-widget-profile-1');
    fireEvent.click(deleteButton);

    // onChange should be called with widget removed
    expect(mockOnChange).toHaveBeenCalled();
    const newLayout = mockOnChange.mock.calls[0][0] as BentoLayout;
    expect(newLayout.widgets).toHaveLength(1);
    expect(newLayout.widgets[0].id).toBe('top8-1');
  });

  it('respects widget size constraints from registry', () => {
    render(
      <TestApp>
        <BentoGridEditor
          layout={layoutWithWidgets}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    // The layout passed to react-grid-layout should include constraints
    const gridLayout = screen.getByTestId('react-grid-layout');
    const layoutData = JSON.parse(gridLayout.getAttribute('data-layout') || '[]');

    // Profile widget should have minW/minH from registry (minSize: { w: 1, h: 1 })
    const profileItem = layoutData.find((item: { i: string }) => item.i === 'profile-1');
    expect(profileItem).toBeDefined();
    expect(profileItem.minW).toBe(1);
    expect(profileItem.minH).toBe(1);
    expect(profileItem.maxW).toBe(4);
    expect(profileItem.maxH).toBe(4);

    // Top8 widget should have minW/minH from registry (minSize: { w: 2, h: 2 })
    const top8Item = layoutData.find((item: { i: string }) => item.i === 'top8-1');
    expect(top8Item).toBeDefined();
    expect(top8Item.minW).toBe(2);
    expect(top8Item.minH).toBe(2);
  });

  it('prevents adding duplicate widgets that do not allow multiple instances', () => {
    const layoutWithProfile: BentoLayout = {
      ...defaultLayout,
      widgets: [
        { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      ],
    };

    render(
      <TestApp>
        <BentoGridEditor
          layout={layoutWithProfile}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    render(
      <TestApp>
        <PageStudioAddWidgetMenu widgets={layoutWithProfile.widgets} onAddWidget={mockOnChange} />
      </TestApp>
    );

    const addButton = screen.getByRole('button', { name: /add widget/i });
    fireEvent.click(addButton);

    const profileOption = screen.getByTestId('add-widget-profile');
    expect(profileOption).toBeDisabled();
  });

  it('allows adding widgets that allow multiple instances', () => {
    const layoutWithGallery: BentoLayout = {
      ...defaultLayout,
      widgets: [
        { id: 'gallery-1', type: 'gallery', x: 0, y: 0, w: 2, h: 2 },
      ],
    };

    render(
      <TestApp>
        <BentoGridEditor
          layout={layoutWithGallery}
          pubkey={mockPubkey}
          onChange={mockOnChange}
        />
      </TestApp>
    );

    render(
      <TestApp>
        <PageStudioAddWidgetMenu widgets={layoutWithGallery.widgets} onAddWidget={mockOnChange} />
      </TestApp>
    );

    const addButton = screen.getByRole('button', { name: /add widget/i });
    fireEvent.click(addButton);

    const galleryOption = screen.getByTestId('add-widget-gallery');
    expect(galleryOption).not.toBeDisabled();
  });
});
