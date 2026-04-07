declare global {
    type WayfinderMethod =
        | 'DELETE'
        | 'GET'
        | 'HEAD'
        | 'PATCH'
        | 'POST'
        | 'PUT'
        | 'delete'
        | 'get'
        | 'head'
        | 'patch'
        | 'post'
        | 'put';

    type WayfinderRoute = {
        method: WayfinderMethod;
        url: string;
    };

    type WayfinderFormMethod = Exclude<WayfinderMethod, 'HEAD' | 'head'>;

    type WayfinderForm = {
        action: string;
        method: WayfinderFormMethod;
    };

    type WayfinderHelper = ((...args: any[]) => WayfinderRoute) & {
        url: (...args: any[]) => string;
        form: ((...args: any[]) => WayfinderForm) &
            Record<string, (...args: any[]) => WayfinderForm>;
        get?: (...args: any[]) => WayfinderRoute;
        head?: (...args: any[]) => WayfinderRoute;
        post?: (...args: any[]) => WayfinderRoute;
        put?: (...args: any[]) => WayfinderRoute;
        patch?: (...args: any[]) => WayfinderRoute;
        delete?: (...args: any[]) => WayfinderRoute;
    };
}

export type WayfinderRouteExport = WayfinderRoute;
export type WayfinderFormExport = WayfinderForm;
export type WayfinderHelperExport = WayfinderHelper;
