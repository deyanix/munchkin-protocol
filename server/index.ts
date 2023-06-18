import * as net from 'net';
import {Logger} from "../common/logger";
import {MunchkinSocket} from "../common/socket";
import {MunchkinConnection} from "../common/connection";
import {MunchkinGame} from "../common/game";
import {MunchkinEmitter} from "../common/emitter";

export interface MunchkinServerOptions {
    timeout: number;
    passcode?: string;
}

export class MunchkinServer extends MunchkinEmitter {
    public static readonly VERSION = '1.0';
    private readonly _server: net.Server;
    private readonly _options: MunchkinServerOptions;
    private readonly _logger: Logger;
    private readonly _connections: MunchkinConnection[] = [];
    private readonly _game: MunchkinGame;

    public constructor(options: MunchkinServerOptions) {
        super();
        this._server = this._createServer();
        this._options = options;
        this._game = new MunchkinGame();
        this._logger = new Logger('SERVER');
    }

    get game(): MunchkinGame {
        return this._game;
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

            munchkinSocket.on('close', () => {
                this._logger.log('Disconnected!');
            });

            const munchkinConnection = new MunchkinConnection(munchkinSocket);

            this._setupConnection(munchkinConnection);
            this._connections.push(munchkinConnection);
        });
    }

    private _setupConnection(connection: MunchkinConnection): void {
        connection.emit('welcome', {
            version: MunchkinServer.VERSION,
            protected: !!this._options.passcode
        });

        connection.requests.on('join', (data, id) => {
            connection.response(id, {status: 'accepted'});
        })

        connection.requests.on('players/create', (data, id) => {
            this._game.createPlayer(data);
            connection.response(id, this._game.players);
            this._connections
                .filter(conn => conn !== connection)
                .forEach(conn => conn.emit('players/synchronize', this._game.players))
        })
    }
}
