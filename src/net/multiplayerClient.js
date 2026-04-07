import * as Colyseus from 'colyseus.js';

function defaultEndpoint() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `ws://${window.location.hostname}:2567`;
  }
  return 'ws://localhost:2567';
}

function resolveEndpoint(configuredEndpoint) {
  if (
    typeof configuredEndpoint === 'string' &&
    configuredEndpoint.trim() !== '' &&
    !configuredEndpoint.includes('YOUR_HOST_IP')
  ) {
    return configuredEndpoint;
  }
  return defaultEndpoint();
}
const DEFAULT_ROOM_NAME = 'game_room';

export async function bootstrapMultiplayer(options = {}) {
  const endpoint = resolveEndpoint(options.endpoint ?? import.meta.env.VITE_COLYSEUS_ENDPOINT);
  const roomName = options.roomName ?? import.meta.env.VITE_COLYSEUS_ROOM ?? DEFAULT_ROOM_NAME;
  const playerName = options.playerName ?? `Player-${Math.floor(Math.random() * 1000)}`;

  const client = new Colyseus.Client(endpoint);
  const room = await client.joinOrCreate(roomName, { name: playerName });

  room.onStateChange((state) => {
    options.onStateChange?.(state);
    const self = state?.players?.get?.(room.sessionId);
    if (self) options.onSelfStateChange?.(self, state);
  });

  room.onMessage('error', (msg) => {
    console.warn('[multiplayer:error]', msg);
  });

  room.onLeave((code) => {
    console.log('[multiplayer] room left:', code);
  });

  console.log('[multiplayer] connected:', {
    endpoint,
    roomName,
    roomId: room.roomId,
    sessionId: room.sessionId,
  });

  const cycleRole = () => room.send('cycleRole');

  return { client, room, cycleRole };
}
