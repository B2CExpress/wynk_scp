import { Router } from 'express';
import type { CronController } from '../controllers/cron.controller';

export function createCronRoutes(controller: CronController): Router {
  const router = Router();

  router.post('/api/cron/publish-scheduled', (req, res) => controller.publishScheduledNews(req, res));

  return router;
}
