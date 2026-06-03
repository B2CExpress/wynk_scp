import { Router } from 'express';
import { 
  getTenants, 
  createTenant, 
  updateTenant, 
  deleteTenant 
} from '../controllers/superadminTenantController';

export function createSuperadminRoutes(): Router {
  const router = Router();

  router.get('/superadmin/tenants', getTenants);
  router.post('/superadmin/tenants', createTenant);
  router.put('/superadmin/tenants/:id', updateTenant);
  router.delete('/superadmin/tenants/:id', deleteTenant);

  return router;
}