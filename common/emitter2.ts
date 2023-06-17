export type UnionToIntersection<U> = (
    U extends any ? (k: U) => void : never
    ) extends (k: infer I) => void
    ? I
    : never

export type ObjectEmitsOptions = Record<
    string,
    ((...args: any[]) => any)
>

export type EmitFn<
    Options extends ObjectEmitsOptions = ObjectEmitsOptions,
    Event extends keyof Options = keyof Options
> = UnionToIntersection<
    {
        [key in Event]: Options[key] extends (...args: infer Args) => any
        ? (event: key, ...args: Args) => ReturnType<Options[key]>
        : (event: key, ...args: any[]) => any
    }[Event]
>


export interface Emitter<Options extends ObjectEmitsOptions> {
    on(name: keyof Options, callback: EmitFn<Options>): void;
    off(name: keyof Options, callback: EmitFn<Options>): void;
    emit: EmitFn<Options>;
}

export class MunckinEmitter implements Emitter {

}
