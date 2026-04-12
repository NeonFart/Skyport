import { router } from '@inertiajs/react';
import {
    Box,
    CheckCircle2,
    Crosshair,
    Cuboid,
    Download,
    ExternalLink,
    Flame,
    Gem,
    Hammer,
    Leaf,
    Puzzle,
    Terminal,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    destroy as depotDestroy,
    install as depotInstall,
} from '@/routes/admin/depot';
import { ConfirmDeleteDialog } from '@/components/admin/data-table';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContentFull,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { SlidingTabs } from '@/components/ui/sliding-tabs';
import type { Tab } from '@/components/ui/sliding-tabs';
import { Spinner } from '@/components/ui/spinner';

export type DepotCategory = {
    key: string;
    label: string;
    description: string;
};

export type DepotItem = {
    key: string;
    category: string;
    icon: string;
    name: string;
    author: string;
    description: string;
    slug: string;
    docker_image_count: number;
    variable_count: number;
};

export type DepotPayload = {
    source_url: string;
    categories: DepotCategory[];
    items: DepotItem[];
    installed: Record<string, number>;
};

const DEPOT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    cube: Cuboid,
    leaf: Leaf,
    hammer: Hammer,
    flame: Flame,
    puzzle: Puzzle,
    crosshair: Crosshair,
    gem: Gem,
    terminal: Terminal,
    box: Box,
};

function depotIcon(name: string): React.ComponentType<{ className?: string }> {
    return DEPOT_ICONS[name] ?? Box;
}

function DepotCard({
    item,
    installed,
    busy,
    onInstall,
    onRemove,
}: {
    item: DepotItem;
    installed: boolean;
    busy: boolean;
    onInstall: (item: DepotItem) => void;
    onRemove: (item: DepotItem) => void;
}) {
    const Icon = depotIcon(item.icon);

    return (
        <div className="group relative flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-1 py-1">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-muted-foreground shadow-xs ring-1 ring-border/60">
                <PlaceholderPattern
                    patternSize={4}
                    className="pointer-events-none absolute inset-0 size-full stroke-current opacity-[0.12]"
                />
                <Icon className="relative h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 pl-2">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                    </p>
                    {installed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <CheckCircle2 className="h-2.5 w-2.5 fill-current" />
                            Installed
                        </span>
                    ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                    {item.description}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                    {item.docker_image_count} images · {item.variable_count}{' '}
                    variables · {item.author}
                </p>
            </div>
            <div className="flex items-center gap-1 pr-2">
                {installed ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                        disabled={busy}
                        onClick={() => onRemove(item)}
                    >
                        {busy ? (
                            <Spinner />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                        )}
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        className="h-8 cursor-pointer"
                        disabled={busy}
                        onClick={() => onInstall(item)}
                    >
                        {busy ? <Spinner /> : <Download className="h-3.5 w-3.5" />}
                        Install
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function DepotModal({
    depot,
    open,
    onClose,
}: {
    depot: DepotPayload;
    open: boolean;
    onClose: () => void;
}) {
    const allTab: Tab = { id: 'all', label: 'All' };
    const categoryTabs: Tab[] = [
        allTab,
        ...depot.categories.map(
            (category): Tab => ({
                id: category.key,
                label: category.label,
            }),
        ),
    ];

    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [removeTarget, setRemoveTarget] = useState<DepotItem | null>(null);

    const filteredItems = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return depot.items.filter((item) => {
            if (activeCategory !== 'all' && item.category !== activeCategory) {
                return false;
            }
            if (normalizedSearch === '') {
                return true;
            }
            return (
                item.name.toLowerCase().includes(normalizedSearch) ||
                item.description.toLowerCase().includes(normalizedSearch) ||
                item.author.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [depot.items, activeCategory, search]);

    const installItem = (item: DepotItem) => {
        setBusyKey(item.key);
        router.post(
            depotInstall.url(item.key),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => toast.success(`${item.name} installed`),
                onError: (errors) =>
                    Object.values(errors).forEach((message) =>
                        toast.error(message),
                    ),
                onFinish: () => setBusyKey(null),
            },
        );
    };

    const removeItem = (item: DepotItem) => {
        setBusyKey(item.key);
        router.delete(depotDestroy.url(item.key), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => toast.success(`${item.name} removed`),
            onError: (errors) =>
                Object.values(errors).forEach((message) =>
                    toast.error(message),
                ),
            onFinish: () => {
                setBusyKey(null);
                setRemoveTarget(null);
            },
        });
    };

    const installedCount = Object.keys(depot.installed).length;

    return (
        <>
            <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
                <DialogContentFull>
                    <div className="px-8 pt-8 pb-4 pr-20">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <DialogTitle className="text-lg">
                                    Depot
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    One-click cargo installs sourced from the
                                    Skyport depot. {depot.items.length} entries
                                    available · {installedCount} installed.
                                </DialogDescription>
                            </div>
                            <a
                                href={depot.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                View source
                            </a>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <SlidingTabs
                                tabs={categoryTabs}
                                active={activeCategory}
                                onChange={setActiveCategory}
                            />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search depot…"
                                className="sm:max-w-xs"
                            />
                        </div>
                    </div>

                    <div className="border-t border-border/60" />

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-6">
                        {filteredItems.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredItems.map((item) => (
                                    <DepotCard
                                        key={item.key}
                                        item={item}
                                        installed={Boolean(
                                            depot.installed[item.slug],
                                        )}
                                        busy={busyKey === item.key}
                                        onInstall={installItem}
                                        onRemove={(target) =>
                                            setRemoveTarget(target)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-sidebar-border/70 px-4 py-10 text-center text-xs text-muted-foreground dark:border-sidebar-border">
                                No depot entries match your filters.
                            </div>
                        )}
                    </div>
                </DialogContentFull>
            </Dialog>

            <ConfirmDeleteDialog
                open={removeTarget !== null}
                onOpenChange={(value) => {
                    if (!value) {
                        setRemoveTarget(null);
                    }
                }}
                title={`Remove ${removeTarget?.name ?? 'cargo'}?`}
                description="The cargo and any servers built from it will be removed. This cannot be undone."
                loading={busyKey === removeTarget?.key}
                onConfirm={() => {
                    if (removeTarget) {
                        removeItem(removeTarget);
                    }
                }}
            />
        </>
    );
}
