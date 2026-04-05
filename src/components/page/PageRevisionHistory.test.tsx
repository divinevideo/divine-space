import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PageRevision } from '@/types/pageHistory';
import { PageRevisionHistory } from './PageRevisionHistory';

const revisions: PageRevision[] = [
  {
    id: 'rev-1',
    createdAt: 123,
    source: 'save-draft',
    pageIdentifier: 'profile-draft',
    page: {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [],
      title: 'Creator Home',
    },
  },
];

describe('PageRevisionHistory', () => {
  it('renders saved revisions and restores one on click', () => {
    const onRestore = vi.fn();

    render(
      <PageRevisionHistory
        revisions={revisions}
        onRestore={onRestore}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /restore creator home/i }));

    expect(onRestore).toHaveBeenCalledWith(revisions[0]);
  });
});
