export class Logger {
    private _name: string;
    private _enable: boolean;

    public constructor(tag: string, enable: boolean = true) {
        this._name = tag;
        this._enable = enable;
    }

    public get name(): string {
        return this._name;
    }

    public get tag(): string {
        return `[${this._name} ${new Date().toISOString()}]`;
    }

    public debug(...messages: unknown[]): void {
        if (!this._enable) {
            return;
        }
        console.debug(this.tag, ...messages);
    }

    public log(...messages: unknown[]): void {
        if (!this._enable) {
            return;
        }
        console.log(this.tag, ...messages);
    }

    public info(...messages: unknown[]): void {
        if (!this._enable) {
            return;
        }
        console.info(this.tag, ...messages);
    }

    public warning(...messages: unknown[]): void {
        if (!this._enable) {
            return;
        }
        console.warn(this.tag, ...messages);
    }

    public error(...messages: unknown[]): void {
        if (!this._enable) {
            return;
        }
        console.error(this.tag, ...messages);
    }

    public catch(error: unknown): void {
        if (error instanceof Error) {
            this.error(error.message);
        } else {
            this.error(error);
        }
    }

}
