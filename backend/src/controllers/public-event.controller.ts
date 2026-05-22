import type { Request, Response, NextFunction } from 'express';
import type { EventService } from '../services/event.service';
import { EventNotFoundError } from '../services/event.service';

export class PublicEventController {
  constructor(private readonly eventService: EventService) {}

  listPublished = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const events = await this.eventService.listPublishedForCurrentTenant(limit);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Vary', 'X-Forwarded-Host');
      res.json(events);
    } catch (err) {
      next(err);
    }
  };

  getBySlugPublished = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const event = await this.eventService.getPublishedBySlugForCurrentTenant(slug);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Vary', 'X-Forwarded-Host');
      res.json(event);
    } catch (err) {
      if (err instanceof EventNotFoundError) {
        res.status(404).json({ error: 'event_not_found' });
        return;
      }
      next(err);
    }
  };
}
