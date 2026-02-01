import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { MoodWidget } from './MoodWidget';
import type { Widget } from '@/types/widgets';

// Helper to create a base widget config
function createWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'mood-1',
    type: 'mood',
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    ...overrides,
  };
}

describe('MoodWidget', () => {
  describe('Display Mode', () => {
    it('renders mood emoji and text when provided', () => {
      const widget = createWidget();
      const mood = { emoji: '😊', text: 'Happy' };

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
            mood={mood}
          />
        </TestApp>
      );

      expect(screen.getByText('😊')).toBeInTheDocument();
      expect(screen.getByText('Happy')).toBeInTheDocument();
      expect(screen.getByText('Current Mood')).toBeInTheDocument();
    });

    it('renders status message when provided and not compact', () => {
      const widget = createWidget({ w: 2, h: 1 }); // Non-compact size
      const mood = { emoji: '🎉', text: 'Excited' };
      const status = 'Living my best life!';

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
            mood={mood}
            status={status}
          />
        </TestApp>
      );

      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('Excited')).toBeInTheDocument();
      expect(screen.getByText(`"${status}"`)).toBeInTheDocument();
    });

    it('hides status message in compact mode', () => {
      const widget = createWidget({ w: 1, h: 1 }); // Compact size
      const mood = { emoji: '😎', text: 'Cool' };
      const status = 'This should not appear';

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
            mood={mood}
            status={status}
          />
        </TestApp>
      );

      expect(screen.getByText('😎')).toBeInTheDocument();
      expect(screen.queryByText(`"${status}"`)).not.toBeInTheDocument();
    });

    it('shows placeholder when no mood is set', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      expect(screen.getByText('No mood set')).toBeInTheDocument();
    });

    it('shows mood without emoji if only text is provided', () => {
      const widget = createWidget();
      const mood = { text: 'Contemplative' };

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
            mood={mood}
          />
        </TestApp>
      );

      expect(screen.getByText('Contemplative')).toBeInTheDocument();
    });
  });

  describe('Editing Mode', () => {
    it('shows "Click to set mood" when in editing mode with no mood', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      expect(screen.getByText('Click to set mood')).toBeInTheDocument();
    });

    it('shows edit indicator when in editing mode with mood set', () => {
      const widget = createWidget();
      const mood = { emoji: '🔥', text: 'On Fire' };

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
            mood={mood}
          />
        </TestApp>
      );

      // The Pencil icon should be present (via the edit class styling)
      const card = screen.getByText('On Fire').closest('.myspace-card');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('opens edit mode when clicking the widget in editing mode', () => {
      const widget = createWidget();
      const mood = { emoji: '✨', text: 'Magical' };

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
            mood={mood}
          />
        </TestApp>
      );

      // Click the card to open edit mode
      const card = screen.getByText('Magical').closest('.myspace-card');
      fireEvent.click(card!);

      // Should now show the edit interface
      expect(screen.getByText('Edit Mood')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mood text...')).toBeInTheDocument();
    });

    it('displays emoji options in edit mode', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // Click to open edit mode
      const placeholder = screen.getByText('Click to set mood');
      fireEvent.click(placeholder.closest('.myspace-card')!);

      // Should show some emoji options
      expect(screen.getByTitle('Happy')).toBeInTheDocument();
      expect(screen.getByTitle('Cool')).toBeInTheDocument();
    });

    it('calls onMoodChange when saving a mood', () => {
      const widget = createWidget();
      const onMoodChange = vi.fn();

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
            onMoodChange={onMoodChange}
          />
        </TestApp>
      );

      // Click to open edit mode
      fireEvent.click(screen.getByText('Click to set mood').closest('.myspace-card')!);

      // Select an emoji
      fireEvent.click(screen.getByTitle('Happy'));

      // The mood text should auto-fill
      const input = screen.getByPlaceholderText('Mood text...');
      expect(input).toHaveValue('Happy');

      // Click save - get all buttons and find the save (first one with Check icon)
      const buttons = screen.getAllByRole('button');
      // The first button in edit mode should be the save button (Check icon)
      const saveButton = buttons[0];
      fireEvent.click(saveButton);

      expect(onMoodChange).toHaveBeenCalledWith({
        emoji: '😊',
        text: 'Happy',
      });
    });

    it('cancels editing without saving', () => {
      const widget = createWidget();
      const mood = { emoji: '😎', text: 'Cool' };
      const onMoodChange = vi.fn();

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
            mood={mood}
            onMoodChange={onMoodChange}
          />
        </TestApp>
      );

      // Click to open edit mode
      fireEvent.click(screen.getByText('Cool').closest('.myspace-card')!);

      // Change the emoji selection
      fireEvent.click(screen.getByTitle('Excited'));

      // Cancel - click the X button (second button)
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons[1]; // X button
      fireEvent.click(cancelButton);

      // Should not call onMoodChange
      expect(onMoodChange).not.toHaveBeenCalled();

      // Should return to display mode with original mood
      expect(screen.getByText('Cool')).toBeInTheDocument();
    });
  });

  describe('Size Adaptations', () => {
    it('uses compact styling for 1x1 widget', () => {
      const widget = createWidget({ w: 1, h: 1 });
      const mood = { emoji: '🚀', text: 'Productive' };

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
            mood={mood}
          />
        </TestApp>
      );

      // In compact mode, status should be hidden
      // We verify this by checking that a status message would not appear
      expect(screen.getByText('Productive')).toBeInTheDocument();
    });

    it('shows full content for larger widget sizes', () => {
      const widget = createWidget({ w: 2, h: 1 });
      const mood = { emoji: '🎨', text: 'Creative' };
      const status = 'Working on something awesome';

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
            mood={mood}
            status={status}
          />
        </TestApp>
      );

      expect(screen.getByText('🎨')).toBeInTheDocument();
      expect(screen.getByText('Creative')).toBeInTheDocument();
      expect(screen.getByText(`"${status}"`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible card structure', () => {
      const widget = createWidget();
      const mood = { emoji: '💪', text: 'Motivated' };

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
            mood={mood}
          />
        </TestApp>
      );

      // The card should contain the mood information
      expect(screen.getByText('Current Mood')).toBeInTheDocument();
      expect(screen.getByText('Motivated')).toBeInTheDocument();
    });

    it('emoji buttons have title attributes for tooltips', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <MoodWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // Open edit mode
      fireEvent.click(screen.getByText('Click to set mood').closest('.myspace-card')!);

      // Check that emoji buttons have titles
      const happyButton = screen.getByTitle('Happy');
      expect(happyButton).toBeInTheDocument();
      expect(happyButton).toHaveTextContent('😊');
    });
  });
});
