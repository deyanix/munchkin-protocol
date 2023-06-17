import {Message, MunchkinSocket} from "./socket";

export type ConnectionMessage<T = any> = {
    data: T;
} & ({
    type: 'event'
} | {
    type: 'request' | 'response';
    id: number;
})

export type ConnectionMessageType = 'event' | 'request' | 'response';

type PromiseCallback<T = void> = ConstructorParameters<typeof Promise<T>>[0];
type PromiseResolve<T = void> = Parameters<PromiseCallback<T>>[0];
type PromiseReject<T = void> = Parameters<PromiseCallback<T>>[1];

interface SendQueueItem<Req = any> {
    message: ConnectionMessage<Req>;
    resolve: PromiseResolve;
    reject: PromiseReject;
}

interface ReceiveQueueItem<Res = any> {
    id: number;
    timeoutId: ReturnType<typeof setTimeout>;
    resolve: PromiseResolve<Res>;
    reject: PromiseReject<Res>;
}


export class MunchkinConnection {
    public static isConnectionMessage(obj: any): obj is ConnectionMessage {
        return (
            typeof obj === 'object' && obj !== null &&
            ['event', 'request', 'response'].includes(obj.type) &&
            obj.data !== undefined
        )
    }

    private _socket: MunchkinSocket;
    private _deflating = false;
    private _sendQueue: SendQueueItem[] = [];
    private _receiveQueue: ReceiveQueueItem[] = [];
    private _nextMessageId: number = 1;

    public constructor(socket: MunchkinSocket) {
        this._socket = socket;
        this._init();
    }

    public dequeue(): void {
        this._deflating = true;
        while (this._deflating && this._sendQueue.length > 0) {
            const item = this._sendQueue.shift();
            if (!item) {
                break;
            }
            this._socket.send(Message.fromObject(item.message));
            item.resolve();
        }
        this._deflating = false;
    }


    public async emit<Req>(data: Req): Promise<void> {
        await this._send({
            type: 'event', data
        });
    }

    public async request<Req, Res>(data: Req): Promise<Res> {
        const id = this._nextMessageId++;
        await this._send({
            type: 'request', id, data
        });
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject();
            }, 5000) // TODO: hardcoded!
            this._receiveQueue.push({
                id, timeoutId, resolve, reject
            })
        })
    }

    private _init(): void {
        this._socket.on('message', (msg) => {
            const msgData = msg.toObject();
            if (!MunchkinConnection.isConnectionMessage(msgData)) {
                return;
            }

            if (msgData.type === 'request') {
                setTimeout(() => {
                    this._send({
                        type: 'response', id: msgData.id, data: {
                            addon: 'Dupa', previous: msgData.data
                        }
                    })
                }, Math.random() * 1000)
            } else if (msgData.type === 'response') {
                const itemIndex = this._receiveQueue
                    .findIndex(i => i.id === msgData.id);
                if (itemIndex < 0) {
                    return;
                }
                const item = this._receiveQueue[itemIndex];
                this._receiveQueue.slice(itemIndex, 1);
                clearTimeout(item.timeoutId);
                item.resolve(msgData.data);
            }
        })
    }

    private _send(message: ConnectionMessage): Promise<void> {
        return new Promise((resolve, reject) => {
            this._sendQueue.push({
                message, resolve, reject
            });
            if (!this._deflating) {
                this.dequeue();
            }
        })
    }
}
