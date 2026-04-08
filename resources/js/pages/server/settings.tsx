import { Head, useForm } from '@inertiajs/react';
import {
    show,
    updateGeneral,
    updateStartup,
} from '@/actions/App/Http/Controllers/Client/ServerSettingsController';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SlidingTabs } from '@/components/ui/sliding-tabs';
import type { Tab } from '@/components/ui/sliding-tabs';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { statusLabel, statusTone } from '@/lib/server-runtime';
import { home } from '@/routes';
import { console as serverConsole } from '@/routes/client/servers';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { AlertCircle, Box, ServerCog } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

type DockerImageOption = {
    image: string;
    label: string;
};

type Props = {
    server: {
        cargo: {
            docker_images: DockerImageOption[];
            id: number;
            name: string;
        };
        docker_image: string | null;
        effective_docker_image: string | null;
        effective_docker_image_label: string | null;
        id: number;
        name: string;
        node: {
            id: number;
            name: string;
        };
        status: string;
    };
};

type GeneralFormData = {
    name: string;
};

type StartupFormData = {
    docker_image: string;
};

const pageTabs: Tab[] = [
    { id: 'general', label: 'General' },
    { id: 'startup', label: 'Startup' },
];

function SettingsPanel({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-md bg-sidebar p-1">
            <div className="rounded-md border border-sidebar-accent bg-background p-6">
                {children}
            </div>
        </div>
    );
}

export default function ServerSettings({ server }: Props) {
    const [tab, setTab] = useState<Tab['id']>('general');
    const minimumMs = 500;
    const generalSubmitStart = useRef(0);
    const startupSubmitStart = useRef(0);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [savingStartup, setSavingStartup] = useState(false);
    const generalForm = useForm<GeneralFormData>({
        name: server.name,
    });
    const startupForm = useForm<StartupFormData>({
        docker_image:
            server.docker_image ?? server.effective_docker_image ?? '',
    });
    const dockerImageOptions = server.cargo.docker_images;
    const selectedDockerImage = useMemo(
        () =>
            dockerImageOptions.find(
                (option) => option.image === startupForm.data.docker_image,
            ) ?? null,
        [dockerImageOptions, startupForm.data.docker_image],
    );
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Home',
            href: home(),
        },
        {
            title: server.name,
            href: serverConsole(server.id),
        },
        {
            title: 'Settings',
            href: show(server.id),
        },
    ];
    const startupHint =
        server.status === 'offline' ||
        server.status === 'install_failed' ||
        server.status === 'pending'
            ? 'Saving a new Docker image will queue it for the next restart.'
            : 'Saving a new Docker image updates the server definition. Restart the server to rebuild it with the new image.';

    const submitGeneral = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        generalForm.patch(updateGeneral.url(server.id), {
            preserveScroll: true,
            onStart: () => {
                generalSubmitStart.current = Date.now();
                setSavingGeneral(true);
            },
            onFinish: () => {
                const remaining =
                    minimumMs - (Date.now() - generalSubmitStart.current);
                setTimeout(
                    () => setSavingGeneral(false),
                    Math.max(0, remaining),
                );
            },
            onSuccess: () => {
                generalForm.setDefaults();
                toast.success('Server settings updated');
            },
            onError: (errors) => {
                Object.values(errors).forEach((message) => {
                    toast.error(message);
                });
            },
        });
    };

    const submitStartup = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        startupForm.patch(updateStartup.url(server.id), {
            preserveScroll: true,
            onStart: () => {
                startupSubmitStart.current = Date.now();
                setSavingStartup(true);
            },
            onFinish: () => {
                const remaining =
                    minimumMs - (Date.now() - startupSubmitStart.current);
                setTimeout(
                    () => setSavingStartup(false),
                    Math.max(0, remaining),
                );
            },
            onSuccess: () => {
                startupForm.setDefaults();
                toast.success('Startup settings updated');
            },
            onError: (errors) => {
                Object.values(errors).forEach((message) => {
                    toast.error(message);
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${server.name} — Settings`} />

            <div className="px-4 py-6">
                <Heading
                    title="Settings"
                    description="Manage this server's general details and runtime startup configuration."
                />

                <div className="space-y-6">
                    <div className="rounded-md bg-sidebar p-1">
                        <div className="flex flex-col gap-4 rounded-md border border-sidebar-accent bg-background p-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                                        {server.name}
                                    </h2>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'border-transparent',
                                            statusTone(server.status),
                                        )}
                                    >
                                        {statusLabel(server.status)}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Running on {server.node.name} with the{' '}
                                    {server.cargo.name} cargo.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-112">
                                <div className="rounded-lg border border-sidebar-accent bg-background px-4 py-3">
                                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                        Current image
                                    </span>
                                    <p className="mt-1 font-medium text-foreground">
                                        {server.effective_docker_image_label ??
                                            'Unavailable'}
                                    </p>
                                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                                        {server.effective_docker_image ??
                                            'No runtime image available'}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-sidebar-accent bg-background px-4 py-3">
                                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                        Override mode
                                    </span>
                                    <p className="mt-1 font-medium text-foreground">
                                        {server.docker_image
                                            ? 'Custom image selected'
                                            : 'Following cargo default'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Changes apply after the next restart
                                        once the daemon syncs the new settings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SlidingTabs
                        tabs={pageTabs}
                        active={tab}
                        onChange={setTab}
                    />

                    {tab === 'general' ? (
                        <form onSubmit={submitGeneral}>
                            <SettingsPanel>
                                <Heading
                                    variant="small"
                                    title="General"
                                    description="Rename the server without changing its allocation or cargo."
                                />

                                <div className="mt-6 max-w-xl space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="server-name">
                                            Server name
                                        </Label>
                                        <Input
                                            id="server-name"
                                            value={generalForm.data.name}
                                            onChange={(event) =>
                                                generalForm.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Alpha"
                                            required
                                        />
                                        <InputError
                                            message={generalForm.errors.name}
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button
                                            type="submit"
                                            disabled={
                                                savingGeneral ||
                                                generalForm.processing ||
                                                !generalForm.isDirty
                                            }
                                        >
                                            {(savingGeneral ||
                                                generalForm.processing) && (
                                                <Spinner />
                                            )}
                                            Save general settings
                                        </Button>
                                    </div>
                                </div>
                            </SettingsPanel>
                        </form>
                    ) : null}

                    {tab === 'startup' ? (
                        <form onSubmit={submitStartup}>
                            <div className="space-y-4">
                                <Alert className="border-sidebar-accent bg-sidebar/40">
                                    <AlertCircle className="text-muted-foreground" />
                                    <AlertTitle>Startup behaviour</AlertTitle>
                                    <AlertDescription>
                                        <p>{startupHint}</p>
                                    </AlertDescription>
                                </Alert>

                                <SettingsPanel>
                                    <Heading
                                        variant="small"
                                        title="Startup"
                                        description="Choose which Docker image should be used the next time this server is rebuilt or restarted."
                                    />

                                    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                                        <div className="space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="docker-image">
                                                    Docker image
                                                </Label>
                                                <Select
                                                    value={
                                                        startupForm.data
                                                            .docker_image
                                                    }
                                                    onValueChange={(value) =>
                                                        startupForm.setData(
                                                            'docker_image',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="docker-image"
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Choose a Docker image" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dockerImageOptions.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={
                                                                        option.image
                                                                    }
                                                                    value={
                                                                        option.image
                                                                    }
                                                                >
                                                                    <span className="flex min-w-0 flex-col items-start gap-0.5">
                                                                        <span className="font-medium text-foreground">
                                                                            {
                                                                                option.label
                                                                            }
                                                                        </span>
                                                                        <span className="break-all font-mono text-xs text-muted-foreground">
                                                                            {
                                                                                option.image
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        startupForm.errors
                                                            .docker_image
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        savingStartup ||
                                                        startupForm.processing ||
                                                        !startupForm.isDirty
                                                    }
                                                >
                                                    {(savingStartup ||
                                                        startupForm.processing) && (
                                                        <Spinner />
                                                    )}
                                                    Save startup settings
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 rounded-lg border border-sidebar-accent bg-muted/20 p-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                <ServerCog className="size-4 text-muted-foreground" />
                                                Selected runtime
                                            </div>

                                            <div className="rounded-lg border border-sidebar-accent bg-background px-4 py-3">
                                                <p className="text-sm font-medium text-foreground">
                                                    {selectedDockerImage?.label ??
                                                        'No image selected'}
                                                </p>
                                                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                                                    {selectedDockerImage?.image ??
                                                        'Choose a Docker image to continue.'}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border border-sidebar-accent bg-background px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                    <Box className="size-4 text-muted-foreground" />
                                                    What happens next?
                                                </div>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    After saving, the daemon
                                                    will store the updated
                                                    startup settings. If the
                                                    server is offline, the
                                                    change stays queued until
                                                    the next start. If it is
                                                    online, restart it to
                                                    rebuild with the new image.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </SettingsPanel>
                            </div>
                        </form>
                    ) : null}
                </div>
            </div>
        </AppLayout>
    );
}
