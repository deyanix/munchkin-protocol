import EventEmitter from "events";

export type EventMap = Record<string, (...args: any[]) => any>;

export type EventKey<Map = EventMap> = keyof Map;

export type EventCallbackParameters<
    Map = EventMap,
    Key extends EventKey<Map> = EventKey<Map>
> = Map[Key] extends (...args: any[]) => any ? Parameters<Map[Key]> : any[];

export type EventReceiver<
    Map = EventMap,
    Key extends EventKey<Map> = EventKey<Map>,
    Callback extends Map[Key] = Map[Key]
> = (...args: EventCallbackParameters<Map, Key>) => void

export type EventEmit<
    Map = EventMap,
    Key extends EventKey<Map> = EventKey<Map>,
    Callback extends Map[Key] = Map[Key]
> = (event: Key, ...args: EventCallbackParameters<Map, Key>) => void

export interface Emitter<Map = EventMap> {
    on<K extends EventKey<Map>>(eventName: K, fn: EventReceiver<Map, K>): void;
    off<K extends EventKey<Map>>(eventName: K, fn: EventReceiver<Map, K>): void;
    emit: EventEmit<Map>;
}

export type EmitterListeners<Map = EventMap> = {
    [key in EventKey<Map>]?: EventReceiver<Map, key>[]
}

export class MunchkinEmitter<Map = EventMap> implements Emitter<Map> {
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

    emit<K extends EventKey<Map>>(event: K, ...args: EventCallbackParameters<Map, K>): void {
        this.listeners[event]?.forEach(fn => fn(...args));
    }
}
