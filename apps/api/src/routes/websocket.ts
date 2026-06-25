import type { FastifyInstance } from 'fastify';

export async function wsRoutes(app: FastifyInstance) {
  app.get('/feed', { websocket: true }, (connection, req) => {
    console.log('🔌 Client connected to WebSocket feed');

    // Subscribe to Redis pub/sub for real-time updates
    const subscriber = app.redis.duplicate();
    
    subscriber.subscribe('blocks:new', 'txs:new', (err) => {
      if (err) console.error('Subscribe error:', err);
    });

    subscriber.on('message', (channel, message) => {
      connection.socket.send(JSON.stringify({
        channel,
        data: JSON.parse(message),
        timestamp: Date.now(),
      }));
    });

    connection.socket.on('close', () => {
      subscriber.unsubscribe();
      subscriber.quit();
      console.log('🔌 Client disconnected');
    });

    // Send welcome message
    connection.socket.send(JSON.stringify({
      channel: 'system',
      message: 'Connected to HypurrScan real-time feed',
    }));
  });
}
