import http from 'node:http';
import express from 'express';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom } from './rooms/GameRoom.js';

const PORT = Number(process.env.PORT ?? 2567);
const app = express();

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'colyseus-server' });
});

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

gameServer.define('game_room', GameRoom);

server.listen(PORT, () => {
  console.log(`[colyseus] listening on ws://localhost:${PORT}`);
});
