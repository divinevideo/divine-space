// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoginDialog from './LoginDialog';
import SignupDialog from './SignupDialog';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { useKeycast } from '@/contexts/KeycastContext';
import { useAuthor } from '@/hooks/useAuthor';
import { useLoginActions } from '@/hooks/useLoginActions';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';
import { Loader2, LogOut, User, Settings, Sparkles } from 'lucide-react';

export interface LoginAreaProps {
  className?: string;
}

export function LoginArea({ className }: LoginAreaProps) {
  const { currentUser } = useLoggedInAccounts();
  const { isAuthenticated: keycastAuth, isLoading: keycastLoading, pubkey: keycastPubkey, logout: keycastLogout } = useKeycast();
  const loginActions = useLoginActions();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);

  // Support both Keycast and Nostrify login
  const isAuthenticated = keycastAuth || !!currentUser;
  const pubkey = keycastPubkey ?? currentUser?.pubkey;
  const isKeycastLogin = keycastAuth && !!keycastPubkey;

  const author = useAuthor(pubkey ?? undefined);

  const handleLogin = () => {
    setLoginDialogOpen(false);
    setSignupDialogOpen(false);
  };

  const handleLogout = () => {
    if (isKeycastLogin) {
      keycastLogout();
    } else {
      loginActions.logout();
    }
  };

  // Show loading state
  if (keycastLoading) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show logged-in state with user dropdown
  if (isAuthenticated && pubkey) {
    const npub = nip19.npubEncode(pubkey);
    const metadata = author.data?.metadata;
    const displayName = metadata?.display_name || metadata?.name || 'Anonymous';
    const initial = displayName[0].toUpperCase();

    return (
      <div className={cn("flex items-center", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={metadata?.picture} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-medium truncate max-w-[120px]">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                {metadata?.nip05 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {metadata.nip05}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/${npub}`} className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/profile" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Show logged-out state with login/signup buttons
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => setLoginDialogOpen(true)}
          className='flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 animate-scale-in'
        >
          <span className='truncate'>Log in</span>
        </Button>
        <Button
          onClick={() => setSignupDialogOpen(true)}
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all"
        >
          <span>Sign up</span>
        </Button>
      </div>

      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLogin={handleLogin}
      />

      <SignupDialog
        isOpen={signupDialogOpen}
        onClose={() => setSignupDialogOpen(false)}
      />
    </div>
  );
}

// Re-export for backwards compatibility
export { LoginArea as default };