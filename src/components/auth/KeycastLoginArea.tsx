import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useKeycast } from '@/contexts/KeycastContext';
import { useAuthor } from '@/hooks/useAuthor';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';
import { Loader2, LogOut, User, Settings, Sparkles } from 'lucide-react';

export interface KeycastLoginAreaProps {
  className?: string;
}

export function KeycastLoginArea({ className }: KeycastLoginAreaProps) {
  const { isAuthenticated, isLoading, pubkey, login, logout } = useKeycast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const author = useAuthor(pubkey ?? undefined);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (e) {
      console.error('Login failed:', e);
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              onClick={logout}
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

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={handleLogin}
        disabled={isLoggingIn}
        className="gap-2"
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Sign in with DiVine
          </>
        )}
      </Button>
    </div>
  );
}
