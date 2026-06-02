import type { Request, Response } from 'express';
import type { HeroService } from '../services/hero.service';
import { parseHeroInput, validateHeroInput } from '../dtos/hero.dto';

export class HeroController {
  constructor(private readonly heroService: HeroService) {}

  async getHero(req: Request, res: Response): Promise<Response> {
    try {
      const hero = await this.heroService.getForCurrentTenant();
      return res.status(200).json(hero);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async putHero(req: Request, res: Response): Promise<Response> {
    try {
      const input = parseHeroInput(req.body);
      const errors = validateHeroInput(input);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const hero = await this.heroService.upsertForCurrentTenant(input);
      return res.status(200).json(hero);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
