import { Router } from 'express';
import type { HeroController } from '../controllers/hero.controller';
import { requireAuth } from '../middleware/require-auth';

export function createHeroRoutes(controller: HeroController): Router {
  const router = Router();

  // Admin (protegidas). Hero é singleton por tenant — sem :id na rota.
  router.get('/api/admin/hero', requireAuth, (req, res) => controller.getHero(req, res));
  router.put('/api/admin/hero', requireAuth, (req, res) => controller.putHero(req, res));

  return router;
}
