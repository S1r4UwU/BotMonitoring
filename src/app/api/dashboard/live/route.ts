import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      interface LiveEventPayload {
        ts: number;
        newCriticalMentions: number;
        newPositiveMentions: number;
        timeline: unknown[];
        sentiments: Record<string, unknown>;
        platforms: Record<string, unknown>;
        ok?: boolean;
      }

      function send(data: LiveEventPayload) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      // Envoi d'un ping initial
      send({ ok: true, ts: Date.now(), newCriticalMentions: 0, newPositiveMentions: 0 });

      const interval = setInterval(() => {
        // Données simulées; en prod, lire depuis DB/engine/queues
        send({
          ts: Date.now(),
          newCriticalMentions: Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0,
          newPositiveMentions: Math.random() < 0.2 ? Math.floor(Math.random() * 10) : 0,
          timeline: [],
          sentiments: {},
          platforms: {},
        });
      }, 5000);

      const close = () => {
        clearInterval(interval);
        controller.close();
      };

      req.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}


