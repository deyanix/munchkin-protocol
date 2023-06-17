import EventEmitter from "events";

export type EventMap = Record<string, (...args: any[]) => any>;

export type EventKey<Map extends EventMap> = keyof Map;

export type EventReceiver<
    Map extends EventMap,
    Key extends EventKey<Map> = EventKey<Map>,
    Callback extends Map[Key] = Map[Key]
> = (...args: Parameters<Callback>) => ReturnType<Callback>

export type EventEmit<
    Map extends EventMap,
    Key extends EventKey<Map> = EventKey<Map>,
    Callback extends Map[Key] = Map[Key]
> = (event: Key, ...args: Parameters<Callback>) => ReturnType<Callback>

export interface Emitter<Map extends EventMap> {
    on<K extends EventKey<Map>>(eventName: K, fn: EventReceiver<Map, K>): void;
    off<K extends EventKey<Map>>(eventName: K, fn: EventReceiver<Map, K>): void;
    emit: EventEmit<Map>;
}

export type EmitterListeners<Map extends EventMap> = {
    [key in EventKey<Map>]?: EventReceiver<Map, key>[]
}

export class MunchkinEmitter<Map extends EventMap> implements Emitter<Map> {
    private listeners: EmitterListeners<Map> = {};

    on<K extends EventKey<Map>>(eventName: K, fn: EventReceiver<Map, K>): void {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName]?.push(fn);
    }

    off<K extends EventKey<Map>>(eventName: K, fn: EventReceiver<Map, K>): void {
        const eventListeners = this.listeners[eventName];
        if (!eventListeners) {
            return;
        }

        const index = eventListeners.indexOf(fn);
        if (index < 0) {
            return;
        }

        eventListeners.slice(index, 1);
    }

    emit<K extends EventKey<Map>>(event: K, ...args: Parameters<Map[K]>): ReturnType<Map[K]> {
        this.listeners[event]?.forEach(fn => fn(...args));
    }
}

const emitter = new MunchkinEmitter<{
    a: () => string,
    b: () => number,
    c: (a: number) => string,
    d: (a: boolean, b: boolean) => number
}>()

emitter.on('d', (a, b) => {
    return 1
})
