import { describe, it, expect } from 'vitest';
import {
  isWidgetType,
  createWidget,
  type Widget,
  type WidgetType,
} from '@/types/widgets';
import {
  widgetRegistry,
  getWidgetDefinition,
  getAvailableWidgetTypes,
  getAllWidgetDefinitions,
  getDefaultSize,
  getMinSize,
  getMaxSize,
  canAddWidget,
  validateWidgetSize,
  applyWidgetConstraints,
} from './widgetRegistry';
import {
  defaultWidgets,
  defaultLayout,
  minimalLayout,
  classicLayout,
  maximalistLayout,
  creatorLayout,
  layoutTemplates,
  getLayoutTemplate,
  getAllLayoutTemplates,
  cloneLayoutWidgets,
  createBentoLayout,
} from './defaultLayout';

describe('Widget Types', () => {
  describe('isWidgetType', () => {
    it('returns true for valid widget types', () => {
      const validTypes: WidgetType[] = [
        'profile', 'top8', 'music', 'links', 'videos',
        'mood', 'gallery', 'notes', 'embed', 'text', 'spacer'
      ];

      validTypes.forEach((type) => {
        expect(isWidgetType(type)).toBe(true);
      });
    });

    it('returns false for invalid widget types', () => {
      expect(isWidgetType('invalid')).toBe(false);
      expect(isWidgetType('')).toBe(false);
      expect(isWidgetType('widget')).toBe(false);
    });
  });

  describe('createWidget', () => {
    it('creates a widget with the specified type and position', () => {
      const widget = createWidget('profile', { x: 0, y: 0 }, { w: 2, h: 2 });

      expect(widget.type).toBe('profile');
      expect(widget.x).toBe(0);
      expect(widget.y).toBe(0);
      expect(widget.w).toBe(2);
      expect(widget.h).toBe(2);
    });

    it('generates a unique id', () => {
      const widget1 = createWidget('profile', { x: 0, y: 0 }, { w: 2, h: 2 });
      const widget2 = createWidget('profile', { x: 0, y: 0 }, { w: 2, h: 2 });

      expect(widget1.id).not.toBe(widget2.id);
      expect(widget1.id).toContain('profile-');
    });

    it('includes config when provided', () => {
      const config = { showBio: true };
      const widget = createWidget('profile', { x: 0, y: 0 }, { w: 2, h: 2 }, config);

      expect(widget.config).toEqual(config);
    });
  });
});

describe('Widget Registry', () => {
  describe('widgetRegistry', () => {
    it('contains all expected widget types', () => {
      const expectedTypes: WidgetType[] = [
        'profile', 'top8', 'music', 'links', 'videos',
        'mood', 'gallery', 'notes', 'embed', 'text', 'spacer'
      ];

      expectedTypes.forEach((type) => {
        expect(widgetRegistry[type]).toBeDefined();
        expect(widgetRegistry[type].type).toBe(type);
      });
    });

    it('has valid size constraints for all widgets', () => {
      Object.values(widgetRegistry).forEach((definition) => {
        // Min should be less than or equal to max
        expect(definition.minSize.w).toBeLessThanOrEqual(definition.maxSize.w);
        expect(definition.minSize.h).toBeLessThanOrEqual(definition.maxSize.h);

        // Default should be within constraints
        expect(definition.defaultSize.w).toBeGreaterThanOrEqual(definition.minSize.w);
        expect(definition.defaultSize.w).toBeLessThanOrEqual(definition.maxSize.w);
        expect(definition.defaultSize.h).toBeGreaterThanOrEqual(definition.minSize.h);
        expect(definition.defaultSize.h).toBeLessThanOrEqual(definition.maxSize.h);
      });
    });

    it('has required metadata for all widgets', () => {
      Object.values(widgetRegistry).forEach((definition) => {
        expect(definition.name).toBeTruthy();
        expect(definition.description).toBeTruthy();
        expect(definition.icon).toBeTruthy();
      });
    });
  });

  describe('getWidgetDefinition', () => {
    it('returns the correct definition for a widget type', () => {
      const definition = getWidgetDefinition('profile');

      expect(definition.type).toBe('profile');
      expect(definition.name).toBe('Profile');
    });
  });

  describe('getAvailableWidgetTypes', () => {
    it('returns all widget types', () => {
      const types = getAvailableWidgetTypes();

      expect(types).toHaveLength(12);
      expect(types).toContain('profile');
      expect(types).toContain('top8');
      expect(types).toContain('music');
    });
  });

  describe('getAllWidgetDefinitions', () => {
    it('returns all widget definitions', () => {
      const definitions = getAllWidgetDefinitions();

      expect(definitions).toHaveLength(12);
      expect(definitions.every((d) => d.type && d.name)).toBe(true);
    });
  });

  describe('getDefaultSize', () => {
    it('returns the default size for a widget type', () => {
      expect(getDefaultSize('profile')).toEqual({ w: 2, h: 2 });
      expect(getDefaultSize('mood')).toEqual({ w: 1, h: 1 });
      expect(getDefaultSize('music')).toEqual({ w: 2, h: 1 });
    });
  });

  describe('getMinSize', () => {
    it('returns the minimum size for a widget type', () => {
      expect(getMinSize('profile')).toEqual({ w: 1, h: 1 });
      expect(getMinSize('top8')).toEqual({ w: 2, h: 2 });
    });
  });

  describe('getMaxSize', () => {
    it('returns the maximum size for a widget type', () => {
      expect(getMaxSize('profile')).toEqual({ w: 4, h: 4 });
      expect(getMaxSize('mood')).toEqual({ w: 2, h: 1 });
    });
  });

  describe('canAddWidget', () => {
    it('returns true for widgets that allow multiple instances', () => {
      const existingWidgets: Widget[] = [
        { id: 'embed-1', type: 'embed', x: 0, y: 0, w: 2, h: 2 },
      ];

      expect(canAddWidget('embed', existingWidgets)).toBe(true);
      expect(canAddWidget('text', existingWidgets)).toBe(true);
      expect(canAddWidget('spacer', existingWidgets)).toBe(true);
    });

    it('returns false for single-instance widgets that already exist', () => {
      const existingWidgets: Widget[] = [
        { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
        { id: 'top8-1', type: 'top8', x: 2, y: 0, w: 2, h: 2 },
      ];

      expect(canAddWidget('profile', existingWidgets)).toBe(false);
      expect(canAddWidget('top8', existingWidgets)).toBe(false);
    });

    it('returns true for single-instance widgets that do not exist yet', () => {
      const existingWidgets: Widget[] = [];

      expect(canAddWidget('profile', existingWidgets)).toBe(true);
      expect(canAddWidget('top8', existingWidgets)).toBe(true);
    });
  });

  describe('validateWidgetSize', () => {
    it('returns the same size if within constraints', () => {
      expect(validateWidgetSize('profile', { w: 2, h: 2 })).toEqual({ w: 2, h: 2 });
    });

    it('clamps to minimum size', () => {
      expect(validateWidgetSize('top8', { w: 1, h: 1 })).toEqual({ w: 2, h: 2 });
    });

    it('clamps to maximum size', () => {
      expect(validateWidgetSize('mood', { w: 4, h: 4 })).toEqual({ w: 2, h: 1 });
    });
  });

  describe('applyWidgetConstraints', () => {
    it('adds constraint properties to a widget', () => {
      const widget: Widget = {
        id: 'profile-1',
        type: 'profile',
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      };

      const constrained = applyWidgetConstraints(widget);

      expect(constrained.minW).toBe(1);
      expect(constrained.minH).toBe(1);
      expect(constrained.maxW).toBe(4);
      expect(constrained.maxH).toBe(4);
    });
  });
});

describe('Default Layouts', () => {
  describe('defaultWidgets', () => {
    it('contains expected widgets', () => {
      const types = defaultWidgets.map((w) => w.type);

      expect(types).toContain('profile');
      expect(types).toContain('music');
      expect(types).toContain('mood');
      expect(types).toContain('links');
      expect(types).toContain('top8');
      expect(types).toContain('videos');
    });

    it('has unique ids', () => {
      const ids = defaultWidgets.map((w) => w.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('fits within 4-column grid', () => {
      defaultWidgets.forEach((widget) => {
        expect(widget.x + widget.w).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('defaultLayout', () => {
    it('has correct structure', () => {
      expect(defaultLayout.type).toBe('bento');
      expect(defaultLayout.gridCols).toBe(4);
      expect(defaultLayout.rowHeight).toBe(150);
      expect(defaultLayout.widgets).toBe(defaultWidgets);
    });
  });

  describe('layout variants', () => {
    const layouts = [
      { name: 'minimal', layout: minimalLayout },
      { name: 'classic', layout: classicLayout },
      { name: 'maximalist', layout: maximalistLayout },
      { name: 'creator', layout: creatorLayout },
    ];

    layouts.forEach(({ name, layout }) => {
      it(`${name} layout has unique ids`, () => {
        const ids = layout.map((w) => w.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });

      it(`${name} layout fits within 4-column grid`, () => {
        layout.forEach((widget) => {
          expect(widget.x + widget.w).toBeLessThanOrEqual(4);
        });
      });
    });
  });

  describe('layoutTemplates', () => {
    it('contains expected templates', () => {
      const ids = layoutTemplates.map((t) => t.id);

      expect(ids).toContain('default');
      expect(ids).toContain('minimal');
      expect(ids).toContain('classic');
      expect(ids).toContain('maximalist');
      expect(ids).toContain('creator');
    });

    it('has required metadata for all templates', () => {
      layoutTemplates.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.widgets.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getLayoutTemplate', () => {
    it('returns the correct template by id', () => {
      const template = getLayoutTemplate('minimal');

      expect(template).toBeDefined();
      expect(template?.id).toBe('minimal');
      expect(template?.name).toBe('Minimal');
    });

    it('returns undefined for unknown id', () => {
      expect(getLayoutTemplate('unknown')).toBeUndefined();
    });
  });

  describe('getAllLayoutTemplates', () => {
    it('returns all templates', () => {
      const templates = getAllLayoutTemplates();

      expect(templates).toHaveLength(5);
    });
  });

  describe('cloneLayoutWidgets', () => {
    it('creates new widgets with fresh ids', () => {
      const original = [
        { id: 'profile', type: 'profile' as const, x: 0, y: 0, w: 2, h: 2 },
        { id: 'music', type: 'music' as const, x: 2, y: 0, w: 2, h: 1 },
      ];

      const cloned = cloneLayoutWidgets(original);

      expect(cloned).toHaveLength(2);
      expect(cloned[0].id).not.toBe(original[0].id);
      expect(cloned[1].id).not.toBe(original[1].id);
      expect(cloned[0].type).toBe('profile');
      expect(cloned[1].type).toBe('music');
    });

    it('preserves position and size', () => {
      const original = [
        { id: 'profile', type: 'profile' as const, x: 1, y: 2, w: 3, h: 4 },
      ];

      const cloned = cloneLayoutWidgets(original);

      expect(cloned[0].x).toBe(1);
      expect(cloned[0].y).toBe(2);
      expect(cloned[0].w).toBe(3);
      expect(cloned[0].h).toBe(4);
    });
  });

  describe('createBentoLayout', () => {
    it('creates a layout with default values', () => {
      const widgets: Widget[] = [
        { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      ];

      const layout = createBentoLayout(widgets);

      expect(layout.type).toBe('bento');
      expect(layout.gridCols).toBe(4);
      expect(layout.rowHeight).toBe(150);
      expect(layout.widgets).toBe(widgets);
    });

    it('allows custom grid settings', () => {
      const widgets: Widget[] = [];
      const layout = createBentoLayout(widgets, 6, 200);

      expect(layout.gridCols).toBe(6);
      expect(layout.rowHeight).toBe(200);
    });
  });
});
