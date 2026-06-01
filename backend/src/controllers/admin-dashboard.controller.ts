import type { Request, Response, NextFunction } from 'express';
import type { AdminDashboardService } from '../services/admin-dashboard.service';
import type { AuthedUser } from '../middleware/require-auth';

export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as Request & { user?: AuthedUser }).user;

      // Verify user has required role
      if (!user || !['editor', 'tenant_admin', 'superadmin'].includes(user.role)) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      const metrics = await this.dashboardService.getMetrics();

      res.json(metrics);
    } catch (err) {
      next(err);
    }
  };
}
