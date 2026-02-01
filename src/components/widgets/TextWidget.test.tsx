import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { TextWidget } from './TextWidget';
import type { Widget } from '@/types/widgets';

// Helper to create a base widget config
function createWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'text-1',
    type: 'text',
    x: 0,
    y: 0,
    w: 2,
    h: 1,
    ...overrides,
  };
}

describe('TextWidget', () => {
  describe('Rendering text content', () => {
    it('renders plain text content', () => {
      const widget = createWidget({
        config: {
          content: 'Hello, World!',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    });

    it('renders markdown content with bold text', () => {
      const widget = createWidget({
        config: {
          content: 'This is **bold** text',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      // The markdown should be rendered
      expect(screen.getByText('bold')).toBeInTheDocument();
      const boldElement = screen.getByText('bold');
      expect(boldElement.tagName).toBe('STRONG');
    });

    it('renders markdown content with italic text', () => {
      const widget = createWidget({
        config: {
          content: 'This is *italic* text',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      expect(screen.getByText('italic')).toBeInTheDocument();
      const italicElement = screen.getByText('italic');
      expect(italicElement.tagName).toBe('EM');
    });

    it('renders markdown links', () => {
      const widget = createWidget({
        config: {
          content: 'Check out [this link](https://example.com)',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      const link = screen.getByRole('link', { name: 'this link' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('Text alignment options', () => {
    it('aligns text to the left by default', () => {
      const widget = createWidget({
        config: {
          content: 'Left aligned text',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      const textContainer = screen.getByText('Left aligned text').closest('.text-content');
      expect(textContainer).toHaveClass('text-left');
    });

    it('aligns text to the center when specified', () => {
      const widget = createWidget({
        config: {
          content: 'Center aligned text',
          align: 'center',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      const textContainer = screen.getByText('Center aligned text').closest('.text-content');
      expect(textContainer).toHaveClass('text-center');
    });

    it('aligns text to the right when specified', () => {
      const widget = createWidget({
        config: {
          content: 'Right aligned text',
          align: 'right',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      const textContainer = screen.getByText('Right aligned text').closest('.text-content');
      expect(textContainer).toHaveClass('text-right');
    });
  });

  describe('Empty state', () => {
    it('shows placeholder when no content is set and not editing', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      expect(screen.getByText('No content')).toBeInTheDocument();
    });

    it('shows "Click to add text" when no content and editing', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      expect(screen.getByText('Click to add text')).toBeInTheDocument();
    });

    it('shows placeholder when content is empty string', () => {
      const widget = createWidget({
        config: {
          content: '',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      expect(screen.getByText('No content')).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('opens edit mode when clicking the widget in editing mode', () => {
      const widget = createWidget({
        config: {
          content: 'Some text',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // Click the card to open edit mode
      const card = screen.getByText('Some text').closest('.myspace-card');
      fireEvent.click(card!);

      // Should now show the edit interface
      expect(screen.getByText('Edit Text')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your text...')).toBeInTheDocument();
    });

    it('shows current content in textarea when editing', () => {
      const widget = createWidget({
        config: {
          content: 'Existing content',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // Click to open edit mode
      const card = screen.getByText('Existing content').closest('.myspace-card');
      fireEvent.click(card!);

      const textarea = screen.getByPlaceholderText('Enter your text...');
      expect(textarea).toHaveValue('Existing content');
    });

    it('shows alignment options in edit mode', () => {
      const widget = createWidget({
        config: {
          content: 'Some text',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // Click to open edit mode
      const card = screen.getByText('Some text').closest('.myspace-card');
      fireEvent.click(card!);

      // Should show alignment buttons
      expect(screen.getByTitle('Align left')).toBeInTheDocument();
      expect(screen.getByTitle('Align center')).toBeInTheDocument();
      expect(screen.getByTitle('Align right')).toBeInTheDocument();
    });

    it('calls onContentChange when saving', () => {
      const widget = createWidget({
        config: {
          content: 'Original text',
        },
      });
      const onContentChange = vi.fn();

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
            onContentChange={onContentChange}
          />
        </TestApp>
      );

      // Click to open edit mode
      const card = screen.getByText('Original text').closest('.myspace-card');
      fireEvent.click(card!);

      // Change the text
      const textarea = screen.getByPlaceholderText('Enter your text...');
      fireEvent.change(textarea, { target: { value: 'Updated text' } });

      // Click save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons[0]; // First button should be save
      fireEvent.click(saveButton);

      expect(onContentChange).toHaveBeenCalledWith('Updated text', 'left');
    });

    it('calls onContentChange with alignment when saving', () => {
      const widget = createWidget({
        config: {
          content: 'Original text',
          align: 'left',
        },
      });
      const onContentChange = vi.fn();

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
            onContentChange={onContentChange}
          />
        </TestApp>
      );

      // Click to open edit mode
      const card = screen.getByText('Original text').closest('.myspace-card');
      fireEvent.click(card!);

      // Click center alignment
      fireEvent.click(screen.getByTitle('Align center'));

      // Click save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons[0];
      fireEvent.click(saveButton);

      expect(onContentChange).toHaveBeenCalledWith('Original text', 'center');
    });

    it('cancels editing without saving', () => {
      const widget = createWidget({
        config: {
          content: 'Original text',
        },
      });
      const onContentChange = vi.fn();

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
            onContentChange={onContentChange}
          />
        </TestApp>
      );

      // Click to open edit mode
      const card = screen.getByText('Original text').closest('.myspace-card');
      fireEvent.click(card!);

      // Change the text
      const textarea = screen.getByPlaceholderText('Enter your text...');
      fireEvent.change(textarea, { target: { value: 'Changed but not saved' } });

      // Click cancel
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons[1]; // Second button should be cancel
      fireEvent.click(cancelButton);

      // Should not call onContentChange
      expect(onContentChange).not.toHaveBeenCalled();

      // Should return to display mode with original content
      expect(screen.getByText('Original text')).toBeInTheDocument();
    });

    it('shows edit indicator (pencil) when in editing mode with content', () => {
      const widget = createWidget({
        config: {
          content: 'Some text',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // The card should have cursor-pointer class in editing mode
      const card = screen.getByText('Some text').closest('.myspace-card');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility', () => {
    it('has accessible card structure', () => {
      const widget = createWidget({
        config: {
          content: 'Accessible content',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={false}
          />
        </TestApp>
      );

      expect(screen.getByText('Accessible content')).toBeInTheDocument();
    });

    it('textarea has accessible placeholder', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // Click to open edit mode
      fireEvent.click(screen.getByText('Click to add text').closest('.myspace-card')!);

      expect(screen.getByPlaceholderText('Enter your text...')).toBeInTheDocument();
    });

    it('alignment buttons have title attributes', () => {
      const widget = createWidget({
        config: {
          content: 'Some text',
        },
      });

      render(
        <TestApp>
          <TextWidget
            widget={widget}
            pubkey="test-pubkey"
            isEditing={true}
          />
        </TestApp>
      );

      // Click to open edit mode
      fireEvent.click(screen.getByText('Some text').closest('.myspace-card')!);

      expect(screen.getByTitle('Align left')).toBeInTheDocument();
      expect(screen.getByTitle('Align center')).toBeInTheDocument();
      expect(screen.getByTitle('Align right')).toBeInTheDocument();
    });
  });
});
