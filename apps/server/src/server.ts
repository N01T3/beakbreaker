import { buildFastifyServer, createServerContainer } from './routes/apiRoutes.js';

export async function startServer(port = Number(process.env.PORT || 3001)) {
  const container = createServerContainer();
  const app = await buildFastifyServer(container);
  await app.listen({ host: '0.0.0.0', port });
  return { app, container, port };
}

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('/server.ts') || process.argv[1].endsWith('/server.js'));

if (isMainModule) {
  startServer().catch((err) => {
    console.error('Failed to start BeakBreaker v5.0 Fastify Server:', err);
    process.exit(1);
  });
}
