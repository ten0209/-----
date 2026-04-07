import { Schema, defineTypes } from '@colyseus/schema';

export class PlayerState extends Schema {
  constructor() {
    super();
    this.sessionId = '';
    this.name = '';
    this.role = '';
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.yaw = 0;
  }
}

defineTypes(PlayerState, {
  sessionId: 'string',
  name: 'string',
  role: 'string',
  x: 'number',
  y: 'number',
  z: 'number',
  yaw: 'number',
});
