import type { Request, Response, NextFunction } from 'express';
import type { TheaterService } from '../services/theater.service';
import {
  TheaterShowNotFoundError,
  TheaterSessionNotFoundError,
  SessionConflictError,
} from '../services/theater.service';
import {
  parseTheaterShowInput,
  validateTheaterShowInput,
  parseTheaterSessionInput,
  validateTheaterSessionInput,
  validateTheaterSessionUpdate,
} from '../dtos/theater.dto';

export class TheaterController {
  constructor(private readonly theaterService: TheaterService) {}

  getShowById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const show = await this.theaterService.getShowByIdForCurrentTenant(id);
      res.json(show);
    } catch (err) {
      if (err instanceof TheaterShowNotFoundError) {
        res.status(404).json({ error: 'show_not_found' });
        return;
      }
      next(err);
    }
  };

  createShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parseTheaterShowInput(req.body as Record<string, unknown>);
      const errors = validateTheaterShowInput(body);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const created = await this.theaterService.createShowForCurrentTenant(body);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  updateShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const body = parseTheaterShowInput(req.body as Record<string, unknown>);
      const errors = validateTheaterShowInput(body);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const updated = await this.theaterService.updateShowForCurrentTenant(id, body);
      res.json(updated);
    } catch (err) {
      if (err instanceof TheaterShowNotFoundError) {
        res.status(404).json({ error: 'show_not_found' });
        return;
      }
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  deleteShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      await this.theaterService.deleteShowForCurrentTenant(id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof TheaterShowNotFoundError) {
        res.status(404).json({ error: 'show_not_found' });
        return;
      }
      next(err);
    }
  };

  publishShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const published = await this.theaterService.publishShowForCurrentTenant(id);
      res.json(published);
    } catch (err) {
      if (err instanceof TheaterShowNotFoundError) {
        res.status(404).json({ error: 'show_not_found' });
        return;
      }
      next(err);
    }
  };

  addSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const showId = req.params.id;
      if (!showId) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const body = parseTheaterSessionInput(req.body as Record<string, unknown>);
      const errors = validateTheaterSessionInput(body);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const session = await this.theaterService.addSessionForCurrentTenant(showId, body);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof TheaterShowNotFoundError) {
        res.status(404).json({ error: 'show_not_found' });
        return;
      }
      if (err instanceof SessionConflictError) {
        res.status(409).json({ error: 'session_conflict', message: 'Session conflicts with existing session (< 90 min apart)' });
        return;
      }
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  updateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const errors = validateTheaterSessionUpdate(body);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const updated = await this.theaterService.updateSessionForCurrentTenant(id, body);
      res.json(updated);
    } catch (err) {
      if (err instanceof TheaterSessionNotFoundError) {
        res.status(404).json({ error: 'session_not_found' });
        return;
      }
      next(err);
    }
  };

  deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      await this.theaterService.deleteSessionForCurrentTenant(id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof TheaterSessionNotFoundError) {
        res.status(404).json({ error: 'session_not_found' });
        return;
      }
      next(err);
    }
  };
}
