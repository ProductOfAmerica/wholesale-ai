import { spawn, type ChildProcess } from 'node:child_process';

const TUNNEL_URL = 'https://wholesale.tarnow.dev';

function startTunnel(): ChildProcess {
  console.log('Starting cloudflare tunnel...');
  
  const tunnel = spawn('cloudflared', ['tunnel', 'run', 'wholesale-ai-dev'], {
    stdio: 'inherit',
    shell: true,
  });

  tunnel.on('error', (err) => {
    console.error('Tunnel error:', err);
  });

  return tunnel;
}

async function main() {
  const tunnelProcess = startTunnel();
  
  // Give tunnel a moment to connect
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  console.log(`\n✓ Tunnel ready: ${TUNNEL_URL}`);
  console.log('Starting turbo dev...\n');

  const turbo = spawn('pnpm', ['dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      SERVER_URL: TUNNEL_URL,
    },
  });

  const cleanup = () => {
    turbo.kill();
    tunnelProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  turbo.on('close', (code) => {
    tunnelProcess.kill();
    process.exit(code ?? 0);
  });
}

main();