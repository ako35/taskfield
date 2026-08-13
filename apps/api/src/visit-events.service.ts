import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';

type VisitEventSubscriber = {
  id: string;
  response: Response;
};

@Injectable()
export class VisitEventsService {
  private readonly subscribers = new Set<VisitEventSubscriber>();

  addSubscriber(response: Response) {
    const subscriber: VisitEventSubscriber = {
      id: randomUUID(),
      response,
    };

    this.subscribers.add(subscriber);
    response.write(': connected\n\n');

    const cleanup = () => {
      this.subscribers.delete(subscriber);
    };

    response.on('close', cleanup);
    response.on('finish', cleanup);
    response.on('error', cleanup);

    return cleanup;
  }

  emitVisitUpdated(visitId: string) {
    const payload = JSON.stringify({
      visitId,
      updatedAt: new Date().toISOString(),
    });

    for (const subscriber of Array.from(this.subscribers)) {
      if (subscriber.response.writableEnded) {
        this.subscribers.delete(subscriber);
        continue;
      }

      subscriber.response.write(`event: visit-updated\ndata: ${payload}\n\n`);
    }
  }
}
