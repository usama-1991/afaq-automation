import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'tenant-service' };
});

const start = async () => {
  try {
    const port = process.env.PORT || 3002;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
