import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/Client/ServerWorkflowsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { home } from '@/routes';
import { console as serverConsole } from '@/routes/client/servers';
import type { BreadcrumbItem } from '@/types';

type StepData = {
    id: string;
    type: 'trigger' | 'condition' | 'action';
    kind: string;
    config: Record<string, string>;
};

type WorkflowEntry = {
    id: number;
    name: string;
    enabled: boolean;
    nodes: StepData[];
    edges: never[];
    updated_at: string | null;
};

type Props = {
    server: { id: number; name: string; status: string };
    workflows: WorkflowEntry[];
};

const triggerOptions = [
    { value: 'schedule', label: 'On a schedule' },
    { value: 'state_change', label: 'On state change' },
    { value: 'backup_complete', label: 'On backup complete' },
    { value: 'startup', label: 'On server start' },
];

const conditionOptions = [
    { value: 'server_online', label: 'Server is online' },
    { value: 'server_offline', label: 'Server is offline' },
];

const actionOptions = [
    { value: 'run_command', label: 'Run command' },
    { value: 'power', label: 'Power action' },
    { value: 'create_backup', label: 'Create backup' },
    { value: 'webhook', label: 'Send webhook' },
];

function labelFor(step: StepData): string {
    const all = [...triggerOptions, ...conditionOptions, ...actionOptions];
    return all.find((o) => o.value === step.kind)?.label ?? step.kind;
}

function summaryFor(step: StepData): string | null {
    if (step.kind === 'schedule' && step.config.interval) {
        return `Every ${step.config.interval} min`;
    }
    if (step.kind === 'state_change' && step.config.target_state) {
        return `→ ${step.config.target_state}`;
    }
    if (step.kind === 'run_command' && step.config.command) {
        return step.config.command;
    }
    if (step.kind === 'power' && step.config.signal) {
        return step.config.signal;
    }
    if (step.kind === 'webhook' && step.config.url) {
        return step.config.url;
    }
    return null;
}

function typeLabel(type: StepData['type']): string {
    return type === 'trigger' ? 'When' : type === 'condition' ? 'If' : 'Then';
}

function typeDot(type: StepData['type']): string {
    return type === 'trigger'
        ? 'bg-amber-500'
        : type === 'condition'
          ? 'bg-emerald-500'
          : 'bg-sky-500';
}

// --- Step editor ---

function StepConfigFields({
    step,
    onChange,
}: {
    step: StepData;
    onChange: (config: Record<string, string>) => void;
}) {
    const set = (key: string, value: string) =>
        onChange({ ...step.config, [key]: value });

    if (step.kind === 'schedule') {
        return (
            <div className="grid gap-2">
                <Label>Interval (minutes)</Label>
                <Input
                    type="number"
                    min={1}
                    value={step.config.interval ?? ''}
                    onChange={(e) => set('interval', e.target.value)}
                    placeholder="10"
                />
            </div>
        );
    }

    if (step.kind === 'state_change') {
        return (
            <div className="grid gap-2">
                <Label>Target state</Label>
                <Select
                    value={step.config.target_state ?? ''}
                    onValueChange={(v) => set('target_state', v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="starting">Starting</SelectItem>
                        <SelectItem value="stopping">Stopping</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        );
    }

    if (step.kind === 'run_command') {
        return (
            <div className="grid gap-2">
                <Label>Command</Label>
                <Input
                    value={step.config.command ?? ''}
                    onChange={(e) => set('command', e.target.value)}
                    placeholder="say Server restarting in 5 minutes"
                    className="font-mono text-xs"
                />
            </div>
        );
    }

    if (step.kind === 'power') {
        return (
            <div className="grid gap-2">
                <Label>Signal</Label>
                <Select
                    value={step.config.signal ?? ''}
                    onValueChange={(v) => set('signal', v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="stop">Stop</SelectItem>
                        <SelectItem value="restart">Restart</SelectItem>
                        <SelectItem value="kill">Kill</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        );
    }

    if (step.kind === 'webhook') {
        return (
            <div className="space-y-3">
                <div className="grid gap-2">
                    <Label>URL</Label>
                    <Input
                        value={step.config.url ?? ''}
                        onChange={(e) => set('url', e.target.value)}
                        placeholder="https://example.com/webhook"
                        className="font-mono text-xs"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Method</Label>
                    <Select
                        value={step.config.method ?? 'POST'}
                        onValueChange={(v) => set('method', v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    return null;
}

function StepRow({
    step,
    index,
    isLast,
    onUpdate,
    onRemove,
}: {
    step: StepData;
    index: number;
    isLast: boolean;
    onUpdate: (step: StepData) => void;
    onRemove: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const summary = summaryFor(step);

    return (
        <div>
            <div className="flex items-stretch gap-3">
                {/* Vertical line + dot */}
                <div className="flex w-5 flex-col items-center">
                    <div
                        className={`mt-4 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-background ${typeDot(step.type)}`}
                    />
                    {!isLast && (
                        <div className="w-px flex-1 bg-border/50" />
                    )}
                </div>

                {/* Card */}
                <div className="mb-2 flex-1">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    {typeLabel(step.type)}
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {labelFor(step)}
                                </span>
                            </div>
                            {summary && !expanded && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {summary}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
                            />
                        </div>
                    </button>

                    {expanded && (
                        <div className="mt-1 rounded-lg border border-border/50 bg-background p-4">
                            <div className="space-y-3">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={step.kind}
                                        onValueChange={(v) =>
                                            onUpdate({
                                                ...step,
                                                kind: v,
                                                config: {},
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(step.type === 'trigger'
                                                ? triggerOptions
                                                : step.type === 'condition'
                                                  ? conditionOptions
                                                  : actionOptions
                                            ).map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <StepConfigFields
                                    step={step}
                                    onChange={(config) =>
                                        onUpdate({ ...step, config })
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Workflow editor ---

function WorkflowEditor({
    workflow,
    serverId,
    onBack,
}: {
    workflow: WorkflowEntry;
    serverId: number;
    onBack: () => void;
}) {
    const [steps, setSteps] = useState<StepData[]>(
        (workflow.nodes as StepData[]) ?? [],
    );
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [addingType, setAddingType] = useState<
        'trigger' | 'condition' | 'action' | null
    >(null);

    const updateStep = useCallback(
        (index: number, step: StepData) => {
            setSteps((s) => s.map((st, i) => (i === index ? step : st)));
            setDirty(true);
        },
        [],
    );

    const removeStep = useCallback((index: number) => {
        setSteps((s) => s.filter((_, i) => i !== index));
        setDirty(true);
    }, []);

    const addStep = (type: StepData['type'], kind: string) => {
        setSteps((s) => [
            ...s,
            {
                id: `${type}-${Date.now()}`,
                type,
                kind,
                config: {},
            },
        ]);
        setDirty(true);
        setAddingType(null);
    };

    const save = () => {
        setSaving(true);
        router.patch(
            update.url({ server: serverId, workflow: workflow.id }),
            { nodes: steps, edges: [] },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDirty(false);
                    toast.success('Workflow saved.');
                },
                onError: (errors) =>
                    Object.values(errors).forEach((m) => toast.error(m)),
                onFinish: () => setSaving(false),
            },
        );
    };

    const addOptions =
        addingType === 'trigger'
            ? triggerOptions
            : addingType === 'condition'
              ? conditionOptions
              : addingType === 'action'
                ? actionOptions
                : [];

    return (
        <div className="px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">
                            {workflow.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {steps.length} step{steps.length !== 1 ? 's' : ''}
                            {dirty ? ' · Unsaved' : ''}
                        </p>
                    </div>
                </div>
                <Button size="sm" onClick={save} disabled={!dirty || saving}>
                    {saving && <Spinner />}
                    Save
                </Button>
            </div>

            <div className="rounded-md bg-sidebar p-1">
                <div className="rounded-md border border-sidebar-accent bg-background p-6">
                    {steps.length > 0 ? (
                        <div>
                            {steps.map((step, index) => (
                                <StepRow
                                    key={step.id}
                                    step={step}
                                    index={index}
                                    isLast={index === steps.length - 1}
                                    onUpdate={(s) => updateStep(index, s)}
                                    onRemove={() => removeStep(index)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-sidebar-border/70 px-4 py-8 text-center dark:border-sidebar-border">
                            <p className="text-xs text-muted-foreground">
                                No steps yet. Add a trigger to start.
                            </p>
                        </div>
                    )}

                    {/* Add step buttons */}
                    <div className="mt-4 flex items-center gap-2">
                        {addingType ? (
                            <div className="flex flex-1 flex-wrap gap-2">
                                {addOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() =>
                                            addStep(addingType, opt.value)
                                        }
                                        className="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setAddingType(null)}
                                    className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setAddingType('trigger')}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Trigger
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setAddingType('condition')}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Condition
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setAddingType('action')}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Action
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Workflow list card ---

function WorkflowCard({
    workflow,
    serverId,
    onOpen,
}: {
    workflow: WorkflowEntry;
    serverId: number;
    onOpen: () => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const steps = (workflow.nodes as StepData[]) ?? [];
    const triggerCount = steps.filter((s) => s.type === 'trigger').length;
    const actionCount = steps.filter((s) => s.type === 'action').length;

    const handleToggle = (enabled: boolean) => {
        setToggling(true);
        router.patch(
            update.url({ server: serverId, workflow: workflow.id }),
            { enabled },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        enabled ? 'Workflow enabled.' : 'Workflow disabled.',
                    ),
                onFinish: () => setToggling(false),
            },
        );
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(
            destroy.url({ server: serverId, workflow: workflow.id }),
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Workflow deleted.'),
                onFinish: () => setDeleting(false),
            },
        );
    };

    return (
        <div className="group relative flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-1 py-1">
            <button
                type="button"
                onClick={onOpen}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-muted-foreground shadow-xs ring-1 ring-border/60 transition-colors hover:bg-muted/50"
            >
                <PlaceholderPattern
                    patternSize={4}
                    className="pointer-events-none absolute inset-0 size-full stroke-current opacity-[0.12]"
                />
                <div className="relative flex flex-col items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="h-3 w-px bg-border/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                </div>
            </button>
            <button
                type="button"
                onClick={onOpen}
                className="min-w-0 flex-1 pl-2 text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                        {workflow.name}
                    </span>
                    {!workflow.enabled && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Disabled
                        </span>
                    )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {triggerCount} trigger{triggerCount !== 1 ? 's' : ''} ·{' '}
                    {actionCount} action{actionCount !== 1 ? 's' : ''}
                </p>
            </button>
            <div className="flex items-center gap-2 pr-3">
                <Switch
                    checked={workflow.enabled}
                    onCheckedChange={handleToggle}
                    disabled={toggling}
                />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={onOpen}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <AlertDialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground"
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <Spinner className="h-3.5 w-3.5" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete {workflow.name}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This workflow will be permanently deleted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

// --- Create workflow dialog ---

function CreateWorkflowDialog({ serverId }: { serverId: number }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '' });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(store.url(serverId), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
                toast.success('Workflow created.');
            },
            onError: (errors) =>
                Object.values(errors).forEach((m) => toast.error(m)),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4" />
                    New workflow
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create workflow</DialogTitle>
                        <DialogDescription>
                            Automate server tasks with triggers, conditions, and
                            actions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 grid gap-2">
                        <Label htmlFor="wf-name">Name</Label>
                        <Input
                            id="wf-name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Auto-restart on crash"
                            maxLength={255}
                            required
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <DialogFooter className="mt-6">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main page ---

export default function ServerWorkflows({ server, workflows }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Home', href: home() },
        { title: server.name, href: serverConsole.url(server.id) },
        { title: 'Workflows', href: `/server/${server.id}/workflows` },
    ];

    const editingWorkflow =
        editingId !== null
            ? workflows.find((w) => w.id === editingId) ?? null
            : null;

    if (editingWorkflow) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`${server.name} — ${editingWorkflow.name}`} />
                <WorkflowEditor
                    key={editingWorkflow.id}
                    workflow={editingWorkflow}
                    serverId={server.id}
                    onBack={() => setEditingId(null)}
                />
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${server.name} — Workflows`} />

            <div className="px-4 py-6">
                <Heading
                    title="Workflows"
                    description="Automate server tasks with triggers, conditions, and actions."
                />

                <div className="rounded-md bg-sidebar p-1">
                    <div className="rounded-md border border-sidebar-accent bg-background p-6">
                        <div className="flex items-center justify-between">
                            <Heading
                                variant="small"
                                title="Automations"
                                description="Workflows run automatically based on triggers you define."
                            />
                            <CreateWorkflowDialog serverId={server.id} />
                        </div>

                        {workflows.length > 0 ? (
                            <div className="mt-4 grid gap-2">
                                {workflows.map((workflow) => (
                                    <WorkflowCard
                                        key={workflow.id}
                                        workflow={workflow}
                                        serverId={server.id}
                                        onOpen={() =>
                                            setEditingId(workflow.id)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-sidebar-border/70 px-4 py-8 text-center dark:border-sidebar-border">
                                <p className="text-xs text-muted-foreground">
                                    No workflows yet. Create one to automate
                                    your server.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
