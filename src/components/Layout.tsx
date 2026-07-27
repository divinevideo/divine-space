import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Menu, X } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useKeycast } from '@/contexts/KeycastContext';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated: keycastAuth, pubkey: keycastPubkey } = useKeycast();
  const { currentUser } = useLoggedInAccounts();

  const isAuthenticated = keycastAuth || !!currentUser;
  const pubkey = keycastPubkey ?? currentUser?.pubkey;

  const navigation = [
    { name: 'home', href: '/' },
    { name: 'browse', href: '/browse' },
    { name: 'search', href: '/search' },
    { name: 'leaderboards', href: '/leaderboard' },
  ];

  const userNavigation = isAuthenticated && pubkey ? [
    { name: 'my page', href: '/studio/page' },
    { name: 'my profile', href: `/${nip19.npubEncode(pubkey)}` },
    { name: 'friends', href: '/friends' },
  ] : [];

  const allNav = [...navigation, ...userNavigation];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center justify-between gap-4">
            {/* Wordmark */}
            <Link to="/" className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-primary text-primary-foreground">
                <Play className="h-3 w-3 fill-current" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                divine<span className="text-primary">.space</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 text-sm">
              {allNav.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'hover:underline underline-offset-4',
                      isActive && 'font-bold underline'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <LoginArea className="hidden sm:flex" />
              <button
                className="md:hidden p-2"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
              {allNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'py-1 hover:underline underline-offset-4',
                    location.pathname === item.href && 'font-bold underline'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-3 border-t border-border">
                <LoginArea className="w-full" />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-3rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>divine.space — a place for videos</span>
          <span className="flex items-center gap-3">
            <a href="https://divine.video" target="_blank" rel="noopener noreferrer" className="hover:underline">
              divine.video
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
