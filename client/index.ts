import * as net from 'net';
import {Message, MunchkinSocket} from "../common/socket";
import {Logger} from "../common/logger";
import {MunchkinConnection} from "../common/connection";

export interface MunchkinClientOptions {
    timeout: number;
}

export class MunchkinClient {
    private _socket: net.Socket;
    private _munchkinSocket: MunchkinSocket;
    private _munchkinConnection: MunchkinConnection;
    private _options: MunchkinClientOptions;
    private _logger: Logger;

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
                .map((_, i) => setTimeout(() => this._munchkinConnection.request(i).then((data) => this._logger.log(i, data)).catch((err) => this._logger.error(err)), Math.random() * 1000))

        });
    }

}
