import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { PageStudioInspector } from './PageStudioInspector';

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PageStudioInspector', () => {
  it('keeps the desktop inspector open when interacting outside', async () => {
    const onClose = vi.fn();

    render(
      <div>
        <button type="button">outside canvas control</button>
        <PageStudioInspector
          widget={{ id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 }}
          onClose={onClose}
          onRemoveWidget={vi.fn()}
          onUpdateWidget={vi.fn()}
        />
      </div>
    );

    expect(screen.getByText(/profile widget/i)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /outside canvas control/i }));

    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/profile widget/i)).toBeVisible();
    });
  });
});
