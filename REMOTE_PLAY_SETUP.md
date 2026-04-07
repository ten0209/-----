# Remote Play Quick Setup

1. Create `.env.local` in project root and copy this:

```env
VITE_PUBLIC_JOIN_URL=http://YOUR_HOST_IP:5173
VITE_COLYSEUS_ENDPOINT=ws://YOUR_HOST_IP:2567
```

2. Replace `YOUR_HOST_IP` with your reachable IP (LAN IP or Tailscale IP).

3. Start server + web:

```bash
npm run dev:server
npm run dev:lan
```

4. Open the URL shown in browser UI (`友達に送るURL`) and send it to your friend.

## Notes

- If using Tailscale, use your `100.x.x.x` IP for both values.
- If friend cannot connect, check firewall rules for ports `5173` and `2567`.
- Vite is configured with `strictPort: true`, so if `5173` is occupied startup fails instead of switching to `5174`.
