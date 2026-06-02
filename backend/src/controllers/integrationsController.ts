import { Request, Response } from 'express';
import { validateIntegrations } from '../utils/integrationsValidator';

export const getIntegrations = async (req: Request, res: Response) => {
  // Retorno provisório simulando o banco de dados
  return res.json({
    ga4_measurement_id: "G-ABC123XYZ",
    meta_pixel_id: "1234567890123456",
    app_store_url: "https://apple.com",
    play_store_url: "https://google.com",
    popup_show_rule: "once_per_session"
  });
};

export const updateIntegrations = async (req: Request, res: Response) => {
  // Executa a validação usando o arquivo da pasta utils
  const { isValid, errors } = validateIntegrations(req.body);
  
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  // Retorno de sucesso provisório até conectar o TypeORM
  return res.json({ ok: true, updated_at: new Date().toISOString() });
};