import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ChromeSkinPicker } from './ChromeSkinPicker';

describe('ChromeSkinPicker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists all skins and marks the active one', () => {
    render(
      <TestApp>
        <ChromeSkinPicker />
      </TestApp>
    );
    for (const name of ['Plain', 'Classic Blue', 'Terminal', 'Scene Kid']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Plain/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches the skin on click', () => {
    render(
      <TestApp>
        <ChromeSkinPicker />
      </TestApp>
    );
    fireEvent.click(screen.getByRole('button', { name: /Terminal/ }));
    expect(document.documentElement.dataset.chromeSkin).toBe('terminal');
  });
});
