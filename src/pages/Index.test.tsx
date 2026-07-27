import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import Index from './Index';

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Index', () => {
  it('renders the claim CTA and section headings', () => {
    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    expect(screen.getByText(/make your own corner of the internet/i)).toBeInTheDocument();
    expect(screen.getByText(/featured pages/i)).toBeInTheDocument();
    expect(screen.getByText(/fresh videos/i)).toBeInTheDocument();
    expect(screen.getByText(/random page/i)).toBeInTheDocument();
  });
});
