import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedFilters, Suggestion } from '@/contexts/FilterContext';
import { useEffect, useState, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

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
  const inputRef = useRef<HTMLInputElement>(null);

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
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
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
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium">{user?.full_name || 'User'}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
