import type { Request, Response } from 'express';
import type { PopupService } from '../services/popup.service';
import { parsePopupInput, validatePopupInput } from '../dtos/popup.dto';
import { PopupNotFoundError, PopupEndDateMinorOrEqualStartDateError } from '../services/popup.service';

export class PopupController {
  constructor(private readonly popupService: PopupService) {}

  async listPopups(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.popupService.listForCurrentTenant();
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPopup(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const popup = await this.popupService.getByIdForCurrentTenant(id);
      return res.status(200).json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        return res.status(404).json({ error: 'popup_not_found' });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createPopup(req: Request, res: Response): Promise<Response> {
    try {
      const input = parsePopupInput(req.body);
      const errors = validatePopupInput(input, false);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const popup = await this.popupService.createForCurrentTenant(input);
      return res.status(201).json(popup);
    } catch (error) {
      if (error instanceof PopupEndDateMinorOrEqualStartDateError) {
        return res.status(400).json({ error: 'ends_before_or_at_start' });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePopup(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const input = parsePopupInput(req.body);
      const errors = validatePopupInput(input, true);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const popup = await this.popupService.updateForCurrentTenant(id, input);
      return res.status(200).json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        return res.status(404).json({ error: 'popup_not_found' });
      }
      if (error instanceof PopupEndDateMinorOrEqualStartDateError) {
        return res.status(400).json({ error: 'ends_before_or_at_start' });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async activatePopup(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const popup = await this.popupService.activateForCurrentTenant(id);
      return res.status(200).json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        return res.status(404).json({ error: 'popup_not_found' });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deactivatePopup(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const popup = await this.popupService.deactivateForCurrentTenant(id);
      return res.status(200).json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        return res.status(404).json({ error: 'popup_not_found' });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deletePopup(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await this.popupService.deleteForCurrentTenant(id);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        return res.status(404).json({ error: 'popup_not_found' });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPublicPopup(req: Request, res: Response): Promise<Response> {
    try {
      const activePopup = await this.popupService.getActivePopupForClient();
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      return res.status(200).json(activePopup || null);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
