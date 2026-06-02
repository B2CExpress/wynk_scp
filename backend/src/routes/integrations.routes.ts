import { Router } from 'express';
import { getIntegrations, updateIntegrations } from '../controllers/integrationsController';

const integrationsRouter = Router();

// Define a rota GET para buscar e a rota PUT para atualizar
integrationsRouter.get('/admin/settings/integrations', getIntegrations);
integrationsRouter.put('/admin/settings/integrations', updateIntegrations);

export default integrationsRouter;