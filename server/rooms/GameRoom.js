import { Room } from '@colyseus/core';
import { GameRoomState } from '../schema/GameRoomState.js';
import { PlayerState } from '../schema/PlayerState.js';

const ROLES = ['hunter', 'bear', 'deer', 'monkey'];

export class GameRoom extends Room {
  maxClients = 8;

  onCreate(options) {
    this.setState(new GameRoomState());
    this.state.phase = 'lobby';
    this.setPatchRate(50);

    this.onMessage('input', (client, data = {}) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      if (Number.isFinite(data.x)) p.x = data.x;
      if (Number.isFinite(data.y)) p.y = data.y;
      if (Number.isFinite(data.z)) p.z = data.z;
      if (Number.isFinite(data.yaw)) p.yaw = data.yaw;
    });

    this.onMessage('setName', (client, data = {}) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || typeof data.name !== 'string') return;
      p.name = data.name.slice(0, 24);
    });

    this.onMessage('setPhase', (_client, data = {}) => {
      if (typeof data.phase !== 'string') return;
      this.state.phase = data.phase;
    });

    this.onMessage('cycleRole', (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      const next = this._nextFreeRole(p.role, client.sessionId);
      if (next) p.role = next;
    });

    console.log('[room:create]', this.roomId, options);
  }

  onJoin(client, options = {}) {
    const p = new PlayerState();
    p.sessionId = client.sessionId;
    p.name = typeof options.name === 'string' ? options.name.slice(0, 24) : `Player-${this.clients.length}`;
    p.role = this._firstFreeRole(client.sessionId) ?? ROLES[0];
    this.state.players.set(client.sessionId, p);
    console.log('[room:join]', this.roomId, client.sessionId);
  }

  onLeave(client) {
    this.state.players.delete(client.sessionId);
    console.log('[room:leave]', this.roomId, client.sessionId);
  }

  onDispose() {
    console.log('[room:dispose]', this.roomId);
  }

  _takenRoles(excludeSessionId = null) {
    const taken = new Set();
    this.state.players.forEach((player, sid) => {
      if (excludeSessionId && sid === excludeSessionId) return;
      if (player?.role) taken.add(player.role);
    });
    return taken;
  }

  _firstFreeRole(excludeSessionId = null) {
    const taken = this._takenRoles(excludeSessionId);
    return ROLES.find((r) => !taken.has(r)) ?? null;
  }

  _nextFreeRole(currentRole, excludeSessionId = null) {
    const taken = this._takenRoles(excludeSessionId);
    const start = Math.max(0, ROLES.indexOf(currentRole));
    for (let i = 1; i <= ROLES.length; i++) {
      const role = ROLES[(start + i) % ROLES.length];
      if (!taken.has(role)) return role;
    }
    return null;
  }
}
