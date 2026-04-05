import type { PageDocument } from '@/types/page';
import { BentoGrid } from '@/components/BentoGrid';
import { createSidebarBentoLayout } from '@/lib/sidebarBentoLayout';
import { PublicPageShell } from './PublicPageShell';

export interface PublicPageRendererProps {
  page: PageDocument;
  pubkey: string;
}

export function PublicPageRenderer({ page, pubkey }: PublicPageRendererProps) {
  const layout = createSidebarBentoLayout(page.widgets, page.gridCols ?? 4, 150);

  return (
    <PublicPageShell page={page}>
      <BentoGrid layout={layout} pubkey={pubkey} />
    </PublicPageShell>
  );
}

export default PublicPageRenderer;
