import * as net from 'net';
import {MunchkinSocket} from "../common/socket";
import {Logger} from "../common/logger";
import {MunchkinConnection} from "../common/connection";

export interface MunchkinClientOptions {
    timeout: number;
}

export class MunchkinClient {
    private readonly _socket: net.Socket;
    private readonly _munchkinSocket: MunchkinSocket;
    private readonly _munchkinConnection: MunchkinConnection;
    private readonly _options: MunchkinClientOptions;
    private readonly _logger: Logger;

    public constructor(options: MunchkinClientOptions) {
        this._socket = new net.Socket();
        this._logger = new Logger('CLIENT');
        this._options = options;
        this._munchkinSocket = new MunchkinSocket(
            this._socket,
            {timeout: options.timeout}
        );
        this._munchkinConnection = new MunchkinConnection(this._munchkinSocket);
    }

    connect(port: number, hostname: string) {
        this._socket.connect(port, hostname, async () => {
            this._logger.log('Connected!');

            Array.from({length: 15})
                .forEach((_, i) => setTimeout(async () => {
                    try {
                        const data = await this._munchkinConnection.request('/test', i);
                        this._logger.log(i, data)
                    } catch (err) {
                        this._logger.catch(err);
                    }
                }, Math.random() * 1000))

        });
    }

}
