import * as net from "net";
import {Logger} from "./logger";
import {MunchkinEmitter} from "./emitter";

export class MunchkinError extends Error {}

export class Message<T = any> {
    public static END_OF_MESSAGE = '\r\n';

    public static fromString<T>(text: string): Message<T> {
        return new Message<T>(Buffer.from(text + Message.END_OF_MESSAGE));
    }

    public static fromObject<T>(obj: T): Message<T> {
        return Message.fromString(JSON.stringify(obj));
    }

    private _buffer: Buffer;

    public constructor(buffer: Buffer) {
        this._buffer = buffer;
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    public append(buffer: Buffer): void {
        this._buffer = Buffer.concat([this._buffer, buffer]);
    }

    public isCompleted(): boolean {
        return this.buffer
            .subarray(-Message.END_OF_MESSAGE.length)
            .toString() === Message.END_OF_MESSAGE;
    }

    public toString(): string {
        return this._buffer.toString();
    }

    public toObject(): T {
        return JSON.parse(this.toString());
    }
}

export interface MunchkinSocketOptions {
    timeout: number;
}

export interface MunchkinSocketEventMap {
    message: (msg: Message) => void;
    error: (err: {
        reason: string,
        error?: unknown,
        message?: Message
    }) => void
    close: () => void;
}

export class MunchkinSocket extends MunchkinEmitter<MunchkinSocketEventMap> {
    private _socket: net.Socket;
    private _options: MunchkinSocketOptions;
    private _logger: Logger;
    private _currentMessage?: Message;
    private _timeoutId?: ReturnType<typeof setTimeout>;

    public constructor(socket: net.Socket, options: MunchkinSocketOptions) {
        super();
        this._socket = socket;
        this._options = options;
        this._logger = new Logger('SOCKET', false);
        this._init();
    }

    public send(message: Message): void {
        this._logger.log('Send', message.toObject());
        if (!message.isCompleted()) {
            throw new MunchkinError('Cannot send a incomplete message');
        }

        this._socket.write(message.buffer);
    }

    private _init(): void {
        this._socket.on('data', (data) => {
            try {
                this._receiveData(data);
            } catch (err) {
                this._logger.catch(err);
            }
        });
        this._socket.on('error', (error: Error & Record<string, unknown>) => {
            if (error.code !== 'ECONNRESET') {
                this.emit('error', {reason: 'socket', error});
            }
        })
        this._socket.on('close', () => {
            this.emit('close');
        })
    }

    private _receiveData(data: Buffer): void {
        while (data.length > 0) {
            const endIndex = data.indexOf(Message.END_OF_MESSAGE) + Message.END_OF_MESSAGE.length;
            const segment = data.subarray(0, endIndex);
            if (!this._currentMessage || this._currentMessage.isCompleted()) {
                this._currentMessage = new Message(segment);
            } else {
                this._currentMessage.append(segment);
            }

            if (this._currentMessage.isCompleted()) {
                this._handleCompleted();
            }
            data = data.subarray(endIndex);
        }

        if (this._currentMessage && !this._currentMessage.isCompleted()) {
            this._clearTimeout();
            this._timeoutId = setTimeout(
                this._handleTimeout.bind(this),
                this._options.timeout
            )
        }
    }

    private _handleCompleted(): void {
        if (!this._currentMessage) {
            return;
        }

        try {
            this._logger.log('Received', this._currentMessage.toObject());
            this.emit('message', this._currentMessage);
        } catch (err) {
            if (err instanceof SyntaxError) {
                this.emit('error', {reason: 'syntax', message: this._currentMessage});
            } else {
                throw err;
            }
        } finally {
            this._clearCurrentMessage();
        }
    }

    private _handleTimeout(): void {
        this.emit('error', {reason: 'timeout', message: this._currentMessage})
        this._clearCurrentMessage();
    }

    private _clearTimeout(): void {
        clearTimeout(this._timeoutId);
    }

    private _clearCurrentMessage(): void {
        this._clearTimeout();
        this._currentMessage = undefined;
        this._timeoutId = undefined;
    }
}
