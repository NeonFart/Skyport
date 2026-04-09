import { usePage } from '@inertiajs/react';
import { WifiOff } from 'lucide-react';

export function NodeOfflineOverlay() {
    const page = usePage();
    const { server } = page.props as typeof page.props & {
        server?: { node?: { online?: boolean } };
    };

    if (!server || server.node?.online !== false) {
        return null;
    }

    return (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-sidebar-border/70 bg-background/90 px-8 py-6 text-center shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <WifiOff className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                        Node offline
                    </p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        The node hosting this server is currently unreachable.
                        This page will be available once the node reconnects.
                    </p>
                </div>
            </div>
        </div>
    );
}
