import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export type SearchableSelectOption = {
    value: string;
    label: string;
    description?: string;
};

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No results found.',
    className,
    disabled,
}: {
    options: SearchableSelectOption[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.value === value);
    const query = search.toLowerCase();
    const filtered = query
        ? options.filter(
              (o) =>
                  o.label.toLowerCase().includes(query) ||
                  (o.description?.toLowerCase().includes(query) ?? false),
          )
        : options;

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    setSearch('');
                }
            }}
        >
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                        className,
                    )}
                >
                    <span
                        className={cn(
                            'truncate',
                            !selected && 'text-muted-foreground',
                        )}
                    >
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    inputRef.current?.focus();
                }}
            >
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-7 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                            {emptyMessage}
                        </p>
                    ) : (
                        filtered.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onValueChange(
                                        option.value === value
                                            ? ''
                                            : option.value,
                                    );
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                                    option.value === value &&
                                        'bg-muted/50',
                                )}
                            >
                                <Check
                                    className={cn(
                                        'h-3.5 w-3.5 shrink-0',
                                        option.value === value
                                            ? 'text-foreground'
                                            : 'text-transparent',
                                    )}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-foreground">
                                        {option.label}
                                    </p>
                                    {option.description && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {option.description}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
