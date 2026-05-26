import type { Request, Response, NextFunction } from 'express';
import type { EventService } from '../services/event.service';
import { EventNotFoundError } from '../services/event.service';
import { parseEventInput, validateEventInput } from '../dtos/event.dto';

export class EventController {
  constructor(private readonly eventService: EventService) {}

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const event = await this.eventService.getByIdForCurrentTenant(id);
      res.json(event);
    } catch (err) {
      if (err instanceof EventNotFoundError) {
        res.status(404).json({ error: 'event_not_found' });
        return;
      }
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parseEventInput(req.body as Record<string, unknown>);
      const errors = validateEventInput(body);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const created = await this.eventService.createForCurrentTenant(body);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const body = parseEventInput(req.body as Record<string, unknown>);
      const errors = validateEventInput(body);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const updated = await this.eventService.updateForCurrentTenant(id, body);
      res.json(updated);
    } catch (err) {
      if (err instanceof EventNotFoundError) {
        res.status(404).json({ error: 'event_not_found' });
        return;
      }
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      await this.eventService.deleteForCurrentTenant(id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof EventNotFoundError) {
        res.status(404).json({ error: 'event_not_found' });
        return;
      }
      next(err);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const published = await this.eventService.publishForCurrentTenant(id);
      res.json(published);
    } catch (err) {
      if (err instanceof EventNotFoundError) {
        res.status(404).json({ error: 'event_not_found' });
        return;
      }
      next(err);
    }
  };
}
