import type { PageRevision } from '@/types/pageHistory';
import { PageRevisionHistory } from '@/components/page/PageRevisionHistory';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface PageStudioHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisions: PageRevision[];
  onRestore: (revision: PageRevision) => void;
  isLoading?: boolean;
}

export function PageStudioHistorySheet({
  open,
  onOpenChange,
  revisions,
  onRestore,
  isLoading = false,
}: PageStudioHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <SheetTitle>Revision history</SheetTitle>
          <SheetDescription>
            Restore a saved page state into your local draft.
          </SheetDescription>
        </SheetHeader>
        <PageRevisionHistory
          revisions={revisions}
          onRestore={onRestore}
          isLoading={isLoading}
        />
      </SheetContent>
    </Sheet>
  );
}

export default PageStudioHistorySheet;
