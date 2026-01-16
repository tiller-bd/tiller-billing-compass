import { Search, X, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedFilters, Suggestion } from '@/contexts/FilterContext';
import { useEffect, useState, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const {
    search,
    setSearch,
    debouncedSearch,
    setSelectedFilter,
    setDepartmentId,
    setClientId,
    setProjectId,
  } = useSharedFilters();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic placeholder based on current page
  const searchPlaceholder = useMemo(() => {
    if (pathname.startsWith('/projects')) return 'Search projects...';
    if (pathname.startsWith('/billing')) return 'Search milestones...';
    if (pathname.startsWith('/clients')) return 'Search clients...';
    if (pathname.startsWith('/users')) return 'Search users...';
    return 'Search...';
  }, [pathname]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearch.trim().length > 2) {
        const res = await fetch(`/api/search/suggestions?query=${debouncedSearch.trim()}`);
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setPopoverOpen(true);
      } else {
        setSuggestions([]);
        setPopoverOpen(false);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch]);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setSelectedFilter(suggestion);
    setSearch(suggestion.name);
    setPopoverOpen(false);

    setDepartmentId('all');
    setClientId('all');
    setProjectId('all');

    if (suggestion.type === 'department') {
      setDepartmentId(suggestion.id);
    } else if (suggestion.type === 'client') {
      setClientId(suggestion.id);
    } else if (suggestion.type === 'project') {
      setProjectId(suggestion.id);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setSuggestions([]);
    setPopoverOpen(false);
    setSelectedFilter(null);
    setDepartmentId('all');
    setClientId('all');
    setProjectId('all');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      <header className="h-14 md:h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          {/* Title - Smaller on mobile */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-xl font-semibold text-foreground truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Desktop Search */}
            <Popover open={popoverOpen && suggestions.length > 0} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder={searchPlaceholder}
                    className="w-64 pl-9 bg-secondary border-border pr-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={handleClearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandList>
                    <CommandEmpty>No match found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                      {suggestions.map((s) => (
                        <CommandItem
                          key={`${s.type}-${s.id}`}
                          onMouseDown={() => handleSelectSuggestion(s)}
                          className="cursor-pointer"
                        >
                          {s.name} ({s.type})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* User Info & Logout */}
            <div className="flex items-center gap-2 md:gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:block text-sm font-medium">{user?.full_name || 'User'}</span>
              {/* Desktop logout button */}
              <Button variant="ghost" size="sm" onClick={logout} className="hidden md:flex">
                Logout
              </Button>
              {/* Mobile logout icon */}
              <Button variant="ghost" size="icon" onClick={logout} className="md:hidden h-9 w-9">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-0 z-50 md:hidden bg-background border-b border-border p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={mobileInputRef}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-8 h-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSearchOpen(false)}
              >
                Cancel
              </Button>
            </div>

            {/* Mobile Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-3 bg-card rounded-lg border border-border overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={`${s.type}-${s.id}`}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                    onClick={() => {
                      handleSelectSuggestion(s);
                      setMobileSearchOpen(false);
                    }}
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">({s.type})</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Search Backdrop */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setMobileSearchOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
