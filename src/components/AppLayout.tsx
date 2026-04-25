import React, { useRef, useState } from 'react';
import { type User } from '@supabase/supabase-js';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bot,
  Building2,
  ChevronDown,
  Crown,
  Cpu,
  LogOut,
  Menu,
  Moon,
  Settings,
  Share2,
  Shield,
  Sun,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import NickAvatar from './NickAvatar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Toaster } from './ui/toaster';
import { Toaster as Sonner } from './ui/sonner';

const heroImage =
  'https://d64gsuwffb70l.cloudfront.net/68b924f79c49746e335d84b0_1756964132097_f184388e.webp';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'trading', label: 'Trading Bot', icon: TrendingUp, path: '/trading' },
  { id: 'leadbot', label: 'Lead Bot', icon: Share2, path: '/leadbot' },
  { id: 'portal', label: 'Customer Portal', icon: Crown, path: '/portal' },
  { id: 'rhnis', label: 'RHNIS Identity', icon: Shield, path: '/rhnis' },
  { id: 'businesses', label: 'Businesses', icon: Building2, path: '/businesses' },
  { id: 'leads', label: 'Lead Manager', icon: Users, path: '/leads' },
  { id: 'workers', label: 'NCS Workers', icon: Cpu, path: '/workers' },
  { id: 'chat', label: 'Nick Chat', icon: Bot, path: '/chat' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const getUserMetadata = (user: User | null) => (user?.user_metadata ?? {}) as Record<string, unknown>;

const getUserAvatarUrl = (user: User | null) => {
  const metadata = getUserMetadata(user);
  const avatarCandidate = [metadata.avatar_url, metadata.picture, metadata.image].find(isNonEmptyString);

  return avatarCandidate ?? undefined;
};

const getUserDisplayName = (user: User | null) => {
  const metadata = getUserMetadata(user);
  const nameCandidate = [metadata.full_name, metadata.name, metadata.display_name].find(isNonEmptyString);

  return nameCandidate ?? user?.email ?? 'Authenticated User';
};

const getUserInitials = (user: User | null) => {
  const metadata = getUserMetadata(user);
  const rawSource = isNonEmptyString(metadata.full_name)
    ? metadata.full_name
    : isNonEmptyString(metadata.name)
      ? metadata.name
      : isNonEmptyString(metadata.display_name)
        ? metadata.display_name
        : user?.email?.split('@')[0] ?? '';

  const parts = rawSource.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return 'RH';
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
};

const LayoutShell: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, closeSidebar } = useAppContext();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);

  const userEmail = user?.email ?? 'Unknown user';
  const userDisplayName = getUserDisplayName(user);
  const userSecondaryLabel = userDisplayName === userEmail ? 'Authenticated session' : userEmail;
  const userAvatarUrl = getUserAvatarUrl(user);
  const userInitials = getUserInitials(user);

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }

    return location.pathname === path;
  };

  const handleNavSelect = () => {
    closeSidebar();
  };

  // Step 1: desktop navigation reads the current account summary directly from AuthContext
  // so users can always see which session is active without querying Supabase in the shell.
  const handleSignOut = async () => {
    setIsSigningOut(true);
    closeSidebar();

    try {
      // Step 2: keep sign-out centralized in AuthContext so Supabase, local dev auth,
      // and protected-route state all clear through the same code path.
      await signOut();
    } catch (error) {
      console.error('Failed to fully sign out of the current session.', error);
    }

    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground transition-colors">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header>
        {/* Hero Section */}
        <div className="relative h-64 overflow-hidden">
          <img src={heroImage} alt="RHNIS Command Center" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-strong/85 to-brand/70"></div>
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6">
              <div className="max-w-2xl space-y-4">
                <h1 className="text-4xl font-bold text-foreground drop-shadow-sm md:text-5xl">
                  RHNIS Control Center
                </h1>
                <p className="text-lg text-foreground/80">
                  Right Hand Nick Identity System - Your AI-powered business automation platform
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/chat"
                    className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
                  >
                    Talk to Nick
                  </Link>
                  <Link
                    to="/rhnis"
                    className="rounded-lg border border-border bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-surface-muted"
                  >
                    View Identity
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="sticky top-0 z-40 border-b border-border bg-surface">
          <div className="container mx-auto px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4 2xl:gap-8">
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Bot className="text-primary-foreground" size={20} />
                  </div>
                  <span className="text-lg font-bold text-foreground">RHNIS</span>
                </div>

                <nav className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto pr-1 2xl:flex [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  {menuItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/40'
                          : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                      }`}
                      aria-current={isActivePath(item.path) ? 'page' : undefined}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button
                  type="button"
                  className="hidden p-2 text-muted-foreground transition-colors hover:text-foreground sm:block"
                  aria-label="Notifications unavailable in this release"
                  disabled
                >
                  <Bell size={20} />
                </button>

                <div className="hidden 2xl:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex shrink-0 items-center gap-3 rounded-full border border-border bg-card/70 py-1.5 pl-1.5 pr-3 transition-colors hover:border-foreground/30 hover:bg-card"
                        aria-label={`Open account menu for ${userDisplayName}`}
                      >
                        <Avatar size="sm" className="border-primary/15 bg-primary/10">
                          <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden min-w-0 text-left lg:block">
                          <p className="max-w-40 truncate text-sm font-medium text-foreground">{userEmail}</p>
                          <p className="text-xs text-muted-foreground">Signed in</p>
                        </div>
                        <ChevronDown size={16} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel className="space-y-1">
                        <p className="truncate font-medium text-foreground">{userDisplayName}</p>
                        <p className="truncate text-xs font-normal text-muted-foreground">
                          {userSecondaryLabel}
                        </p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          void handleSignOut();
                        }}
                        disabled={isSigningOut}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <LogOut size={16} />
                        {isSigningOut ? 'Signing out...' : 'Sign out'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <button
                  ref={navigationTriggerRef}
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-muted-foreground transition-colors hover:text-foreground 2xl:hidden"
                  aria-label="Open navigation drawer"
                >
                  <Menu size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[min(24rem,92vw)] border-border bg-surface p-0"
          onCloseAutoFocus={(event) => {
            // The drawer opens from a plain button instead of <SheetTrigger>, so we
            // restore focus manually when the sheet closes.
            event.preventDefault();
            navigationTriggerRef.current?.focus();
          }}
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border px-6 pb-5 pt-6 pr-14">
              <SheetTitle className="text-left text-foreground">Navigation</SheetTitle>
              <SheetDescription className="text-left">
                Move between dashboard areas and manage the active user session.
              </SheetDescription>
            </SheetHeader>

            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 p-4">
                <Avatar size="md" className="shrink-0 border-primary/15 bg-primary/10">
                  <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{userDisplayName}</p>
                  <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={handleNavSelect}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                  }`}
                  aria-current={isActivePath(item.path) ? 'page' : undefined}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-2 border-t border-border px-4 py-4">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  closeSidebar();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                {theme === 'light' ? 'Dark theme' : 'Light theme'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={isSigningOut}
                className="flex w-full items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogOut size={20} />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Keep the routed view inside a named landmark so skip links and screen-reader navigation
          jump directly to the dashboard content instead of replaying the shell each time. */}
      <main id="main-content" tabIndex={-1} className="container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Floating Nick Avatar */}
      <NickAvatar isFloating={true} />

      {/* Status Bar */}
      <footer
        aria-label="System status"
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface p-4"
      >
        <div className="container mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Nick Active</span>
            </div>
          </div>
          <div className="text-muted-foreground">Last sync: {new Date().toLocaleTimeString()}</div>
        </div>
      </footer>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <ThemeProvider>
    <LayoutShell />
    {/* Toasts live inside the theme provider so they match the active palette. */}
    <Toaster />
    <Sonner />
  </ThemeProvider>
);

export default AppLayout;
