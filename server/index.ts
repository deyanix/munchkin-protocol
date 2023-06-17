import * as net from 'net';
import EventEmitter from "events";
import {Logger} from "../common/logger";
import {MunchkinSocket} from "../common/socket";
import {MunchkinConnection} from "../common/connection";

export interface MunchkinServerOptions {
    timeout: number;
}

export class MunchkinServer extends EventEmitter{
    private _server: net.Server;
    private _options: MunchkinServerOptions;
    private _logger: Logger;
    private _sockets: MunchkinSocket[] = [];

    public constructor(options: MunchkinServerOptions) {
        super();
        this._server = this._createServer();
        this._options = options;
        this._logger = new Logger('SERVER');
    }

    public start(port: number, hostname?: string) {
        this._server.listen(port, hostname);
    }

    private _createServer(): net.Server {
        return net.createServer((socket) => {
            this._logger.log('Connected.');

            const munchkinSocket = new MunchkinSocket(
                socket,
                {timeout: this._options.timeout}
            );
            const munchkinConnection = new MunchkinConnection(munchkinSocket);
            Array.from({length: 15})
                .map((_, i) => setTimeout(() => munchkinConnection.request(i).then((data) => this._logger.log(i, data)).catch((err) => this._logger.error(err)), Math.random() * 1000))

            this._sockets.push(munchkinSocket);
        });
    }
}
