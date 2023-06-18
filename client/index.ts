import * as net from 'net';
import {MunchkinSocket} from "../common/socket";
import {Logger} from "../common/logger";
import {MunchkinConnection} from "../common/connection";
import {MunchkinGame, MunchkinGender, MunchkinPlayer, MunchkinPlayerData} from "../common/game";

export interface MunchkinClientOptions {
    timeout: number;
}

export class MunchkinClient {
    public static readonly VERSION = '1.0';
    private readonly _socket: net.Socket;
    private readonly _munchkinSocket: MunchkinSocket;
    private readonly _munchkinConnection: MunchkinConnection;
    private readonly _options: MunchkinClientOptions;
    private readonly _logger: Logger;
    private readonly _game: MunchkinGame;

    public constructor(options: MunchkinClientOptions) {
        this._socket = new net.Socket();
        this._logger = new Logger('CLIENT');
        this._options = options;
        this._munchkinSocket = new MunchkinSocket(
            this._socket,
            {timeout: options.timeout}
        );
        this._munchkinConnection = new MunchkinConnection(this._munchkinSocket);
        this._game = new MunchkinGame();
    }

    get game(): MunchkinGame {
        return this._game;
    }

    connect(port: number, hostname: string) {
        this._socket.connect(port, hostname, async () => {
            this._logger.log('Connected!');

            this._munchkinConnection.events.on('welcome', (data) => {
                this._logger.log(data);
            })

            this._munchkinConnection.events.on('players/synchronize', (data: MunchkinPlayer[]) => {
                this._game.players = data;
            })

            const status = await this._munchkinConnection.request('join', {
                version: MunchkinClient.VERSION
            });
            this._logger.log('Connection status', status);

            this._game.players = await this._munchkinConnection.request<MunchkinPlayerData, MunchkinPlayer[]>('players/create', {
                name: 'Test',
                gear: 0,
                level: 1,
                gender: MunchkinGender.MALE,
                genderChanged: true
            });
        });
    }

}
