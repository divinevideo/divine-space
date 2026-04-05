import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface PageStudioActionsMenuProps {
  onOpenHistory: () => void;
}

export function PageStudioActionsMenu({ onOpenHistory }: PageStudioActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-full gap-2 sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <MoreHorizontal className="h-4 w-4" />
          More actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={() => {
            onOpenHistory();
            setOpen(false);
          }}
        >
          Revision history
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/studio/ai">Generate with AI</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PageStudioActionsMenu;
