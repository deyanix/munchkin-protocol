import {MunchkinEmitter} from "./emitter";

export enum MunchkinGender {
    MALE = 'M',
    FEMALE = 'F'
}

export interface MunchkinPlayer {
    id: number;
    name: string;
    level: number;
    gear: number;
    gender: MunchkinGender;
    genderChanged: boolean;
}

export type MunchkinPlayerData = Omit<MunchkinPlayer, 'id'>;

export interface MunchkinGameEventMap {
    updated: () => void;
}

export class MunchkinGame extends MunchkinEmitter<MunchkinGameEventMap> {
    private _nextPlayerId: number = 1;
    private _players: MunchkinPlayer[] = []

    public createPlayer(playerData: MunchkinPlayerData): void {
        const player: MunchkinPlayer = {id: this._nextPlayerId++, ...playerData};
        this._players.push(player);
        this.emit('updated');
    }

    public updatePlayer(id: number, player: MunchkinPlayer): void {
        if (this._players[id]) {
            this._players[id] = player;
            this.emit('updated');
        }
    }

    public get players(): MunchkinPlayer[] {
        return Object.values(this._players);
    }

    public set players(players: MunchkinPlayer[]) {
        this._players = Object.values(players);
        this.emit('updated');
    }
}
