import { Schema, MapSchema, defineTypes } from '@colyseus/schema';
import { PlayerState } from './PlayerState.js';

export class GameRoomState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.phase = 'lobby';
  }
}

defineTypes(GameRoomState, {
  players: { map: PlayerState },
  phase: 'string',
});
