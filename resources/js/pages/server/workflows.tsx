import { Head, router, useForm } from '@inertiajs/react';
import {
    ReactFlow,
    Background,
    Controls,
    type Node,
    type Edge,
    type NodeTypes,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    Handle,
    Position,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    ArrowLeft,
    ChevronRight,
    Clock,
    Command,
    HardDrive,
    Pencil,
    Play,
    Plus,
    Power,
    RefreshCw,
    Server,
    Trash2,
    Zap,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
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

type WorkflowEntry = {
    id: number;
    name: string;
    enabled: boolean;
    nodes: Node[];
    edges: Edge[];
    updated_at: string | null;
};

type Props = {
    server: { id: number; name: string; status: string };
    workflows: WorkflowEntry[];
};

// --- Custom node definitions ---

const triggerTypes = [
    { value: 'schedule', label: 'Schedule', icon: Clock, desc: 'Run on a timer' },
    { value: 'state_change', label: 'State change', icon: Server, desc: 'When server state changes' },
    { value: 'backup_complete', label: 'Backup complete', icon: HardDrive, desc: 'After a backup finishes' },
    { value: 'startup', label: 'Server start', icon: Play, desc: 'When server starts' },
];

const actionTypes = [
    { value: 'run_command', label: 'Run command', icon: Command, desc: 'Send a console command' },
    { value: 'power', label: 'Power action', icon: Power, desc: 'Start, stop, restart, or kill' },
    { value: 'create_backup', label: 'Create backup', icon: HardDrive, desc: 'Create a new backup' },
    { value: 'webhook', label: 'Webhook', icon: Zap, desc: 'Send an HTTP request' },
];

const conditionTypes = [
    { value: 'server_online', label: 'Server is online', icon: Server },
    { value: 'server_offline', label: 'Server is offline', icon: Server },
];

function TriggerNode({ data }: { data: Record<string, string> }) {
    const trigger = triggerTypes.find((t) => t.value === data.triggerType);
    const Icon = trigger?.icon ?? Clock;

    return (
        <div className="min-w-48 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 px-4 py-3 shadow-lg shadow-amber-500/5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70">
                        Trigger
                    </p>
                    <p className="text-xs font-medium text-foreground">
                        {trigger?.label ?? 'Select trigger'}
                    </p>
                </div>
            </div>
            {data.triggerType === 'schedule' && data.interval && (
                <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-600 dark:text-amber-400">
                    Every {data.interval} minutes
                </p>
            )}
            {data.triggerType === 'state_change' && data.targetState && (
                <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-600 dark:text-amber-400">
                    → {data.targetState}
                </p>
            )}
            <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !rounded-full !border-2 !border-amber-500 !bg-background" />
        </div>
    );
}

function ActionNode({ data }: { data: Record<string, string> }) {
    const action = actionTypes.find((a) => a.value === data.actionType);
    const Icon = action?.icon ?? Command;

    return (
        <div className="min-w-48 rounded-xl border-2 border-sky-500/30 bg-sky-500/5 px-4 py-3 shadow-lg shadow-sky-500/5 backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="!h-3 !w-3 !rounded-full !border-2 !border-sky-500 !bg-background" />
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-500">
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-500/70">
                        Action
                    </p>
                    <p className="text-xs font-medium text-foreground">
                        {action?.label ?? 'Select action'}
                    </p>
                </div>
            </div>
            {data.actionType === 'run_command' && data.command && (
                <p className="mt-2 rounded-md bg-sky-500/10 px-2 py-1 font-mono text-[11px] text-sky-600 dark:text-sky-400">
                    {data.command}
                </p>
            )}
            {data.actionType === 'power' && data.signal && (
                <p className="mt-2 rounded-md bg-sky-500/10 px-2 py-1 text-[11px] text-sky-600 dark:text-sky-400">
                    {data.signal}
                </p>
            )}
            <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !rounded-full !border-2 !border-sky-500 !bg-background" />
        </div>
    );
}

function ConditionNode({ data }: { data: Record<string, string> }) {
    const condition = conditionTypes.find((c) => c.value === data.conditionType);

    return (
        <div className="min-w-48 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 px-4 py-3 shadow-lg shadow-emerald-500/5 backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="!h-3 !w-3 !rounded-full !border-2 !border-emerald-500 !bg-background" />
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                    <RefreshCw className="h-3.5 w-3.5" />
                </div>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500/70">
                        Condition
                    </p>
                    <p className="text-xs font-medium text-foreground">
                        {condition?.label ?? 'Select condition'}
                    </p>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !rounded-full !border-2 !border-emerald-500 !bg-background" />
        </div>
    );
}

const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
};

const defaultEdgeOptions = {
    animated: true,
    style: { stroke: 'rgba(148, 163, 184, 0.4)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(148, 163, 184, 0.4)' },
};

// --- Add node panel ---

function AddNodePanel({
    onAdd,
}: {
    onAdd: (type: string, subtype: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<'trigger' | 'condition' | 'action'>('trigger');

    const items =
        tab === 'trigger'
            ? triggerTypes.map((t) => ({ ...t, nodeType: 'trigger', subtype: t.value }))
            : tab === 'action'
              ? actionTypes.map((a) => ({ ...a, nodeType: 'action', subtype: a.value }))
              : conditionTypes.map((c) => ({ ...c, nodeType: 'condition', subtype: c.value, desc: '' }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                    <Plus className="h-4 w-4" />
                    Add node
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add a node</DialogTitle>
                    <DialogDescription>Choose what to add to this workflow.</DialogDescription>
                </DialogHeader>

                <div className="mt-2 flex gap-1 rounded-lg bg-muted p-1">
                    {(['trigger', 'condition', 'action'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                tab === t
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="mt-3 grid gap-2">
                    {items.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.subtype}
                                type="button"
                                onClick={() => {
                                    onAdd(item.nodeType, item.subtype);
                                    setOpen(false);
                                }}
                                className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/50 active:scale-[0.98]"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    {'desc' in item && item.desc && (
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
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
    const [flowNodes, setFlowNodes] = useState<Node[]>(workflow.nodes ?? []);
    const [flowEdges, setFlowEdges] = useState<Edge[]>(workflow.edges ?? []);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            setFlowNodes((nds) => applyNodeChanges(changes, nds));
            setDirty(true);
        },
        [],
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            setFlowEdges((eds) => applyEdgeChanges(changes, eds));
            setDirty(true);
        },
        [],
    );

    const onConnect: OnConnect = useCallback(
        (connection) => {
            setFlowEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions }, eds));
            setDirty(true);
        },
        [],
    );

    const addNode = useCallback(
        (nodeType: string, subtype: string) => {
            const id = `${nodeType}-${Date.now()}`;
            const yOffset = flowNodes.length * 120 + 50;
            const dataKey =
                nodeType === 'trigger'
                    ? 'triggerType'
                    : nodeType === 'action'
                      ? 'actionType'
                      : 'conditionType';

            setFlowNodes((nds) => [
                ...nds,
                {
                    id,
                    type: nodeType,
                    position: { x: 250, y: yOffset },
                    data: { [dataKey]: subtype },
                },
            ]);
            setDirty(true);
        },
        [flowNodes.length],
    );

    const save = () => {
        setSaving(true);
        router.patch(
            update.url({ server: serverId, workflow: workflow.id }),
            { nodes: flowNodes, edges: flowEdges },
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

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <p className="text-sm font-medium text-foreground">{workflow.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {flowNodes.length} node{flowNodes.length !== 1 ? 's' : ''}
                            {dirty && ' · Unsaved changes'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AddNodePanel onAdd={addNode} />
                    <Button size="sm" onClick={save} disabled={!dirty || saving}>
                        {saving && <Spinner />}
                        Save
                    </Button>
                </div>
            </div>

            <div className="relative flex-1">
                <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    fitView
                    className="!bg-background"
                    proOptions={{ hideAttribution: true }}
                >
                    <Background gap={20} size={1} className="!stroke-border/30" />
                    <Controls
                        showInteractive={false}
                        className="!rounded-lg !border !border-border/50 !bg-background !shadow-lg [&>button]:!border-border/30 [&>button]:!bg-background [&>button]:!text-muted-foreground [&>button:hover]:!bg-muted"
                    />
                </ReactFlow>
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
    const triggerCount = (workflow.nodes ?? []).filter((n: Node) => n.type === 'trigger').length;
    const actionCount = (workflow.nodes ?? []).filter((n: Node) => n.type === 'action').length;

    const handleToggle = (enabled: boolean) => {
        setToggling(true);
        router.patch(
            update.url({ server: serverId, workflow: workflow.id }),
            { enabled },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(enabled ? 'Workflow enabled.' : 'Workflow disabled.'),
                onFinish: () => setToggling(false),
            },
        );
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(destroy.url({ server: serverId, workflow: workflow.id }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Workflow deleted.'),
            onFinish: () => setDeleting(false),
        });
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
                <Zap className="relative h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={onOpen}
                className="min-w-0 flex-1 pl-2 text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{workflow.name}</span>
                    {!workflow.enabled && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Disabled
                        </span>
                    )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{triggerCount} trigger{triggerCount !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{actionCount} action{actionCount !== 1 ? 's' : ''}</span>
                </div>
            </button>
            <div className="flex items-center gap-2 pr-3">
                <Switch
                    checked={workflow.enabled}
                    onCheckedChange={handleToggle}
                    disabled={toggling}
                />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onOpen}>
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit workflow</TooltipContent>
                </Tooltip>
                <AlertDialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={deleting}>
                                    {deleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete {workflow.name}</AlertDialogTitle>
                            <AlertDialogDescription>This workflow and all its automation rules will be permanently deleted.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
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
            onError: (errors) => Object.values(errors).forEach((m) => toast.error(m)),
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
                            Workflows automate actions on your server using triggers, conditions, and actions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 grid gap-2">
                        <Label htmlFor="wf-name">Workflow name</Label>
                        <Input
                            id="wf-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
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

    const editingWorkflow = editingId !== null
        ? workflows.find((w) => w.id === editingId) ?? null
        : null;

    if (editingWorkflow) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`${server.name} — ${editingWorkflow.name}`} />
                <div className="flex h-[calc(100vh-4rem)] flex-col">
                    <WorkflowEditor
                        key={editingWorkflow.id}
                        workflow={editingWorkflow}
                        serverId={server.id}
                        onBack={() => setEditingId(null)}
                    />
                </div>
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

                <div className="space-y-4">
                    <div className="rounded-md bg-sidebar p-1">
                        <div className="rounded-md border border-sidebar-accent bg-background p-6">
                            <div className="flex items-center justify-between">
                                <Heading
                                    variant="small"
                                    title="Automations"
                                    description="Create workflows to automate commands, power actions, backups, and more."
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
                                            onOpen={() => setEditingId(workflow.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-dashed border-sidebar-border/70 px-4 py-8 text-center dark:border-sidebar-border">
                                    <p className="text-xs text-muted-foreground">
                                        No workflows yet. Create one to automate your server.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
