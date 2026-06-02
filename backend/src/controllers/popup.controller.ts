import type { Request, Response } from 'express';
import type { PopupService } from '../services/popup.service';
import { parsePopupInput } from '../dtos/popup.dto';
import {
  PopupNotFoundError,
  PopupStartDateInPastError,
  PopupEndDateMinorOrEqualStartDateError,
  PopupPeriodConflict,
} from '../services/popup.service';

export class PopupController {
  constructor(private readonly popupService: PopupService) {}

  async listPopups(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const pageSize = parseInt(req.query.page_size as string, 10) || 20;

      const result = await this.popupService.listForCurrentTenant(page, pageSize);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getPopup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const popup = await this.popupService.getByIdForCurrentTenant(id);
      res.json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        res.status(404).json({ error: 'popup_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async createPopup(req: Request, res: Response): Promise<void> {
    try {
      const input = parsePopupInput(req.body);
      
      const popup = await this.popupService.createForCurrentTenant(input);
      res.status(201).json(popup);
    } catch (error) {
      if (error instanceof PopupStartDateInPastError) {
        res.status(400).json({ error: 'starts_at_too_far_in_past' });
      } else if (error instanceof PopupEndDateMinorOrEqualStartDateError) {
        res.status(400).json({ error: 'ends_before_or_at_start' });
      } else if (error instanceof PopupPeriodConflict) {
        res.status(409).json({ error: 'period_conflict' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updatePopup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input = parsePopupInput(req.body);

      const popup = await this.popupService.updateForCurrentTenant(id, input);
      res.json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        res.status(404).json({ error: 'popup_not_found' });
      } else if (error instanceof PopupStartDateInPastError) {
        res.status(400).json({ error: 'starts_at_too_far_in_past' });
      } else if (error instanceof PopupEndDateMinorOrEqualStartDateError) {
        res.status(400).json({ error: 'ends_before_or_at_start' });
      } else if (error instanceof PopupPeriodConflict) {
        res.status(409).json({ error: 'period_conflict' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async activatePopup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const popup = await this.popupService.activateForCurrentTenant(id);
      res.json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        res.status(404).json({ error: 'popup_not_found' });
      } else if (error instanceof PopupPeriodConflict) {
        res.status(409).json({ error: 'period_conflict' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async deactivatePopup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const popup = await this.popupService.deactivateForCurrentTenant(id);
      res.json(popup);
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        res.status(404).json({ error: 'popup_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async deletePopup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.popupService.deleteForCurrentTenant(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof PopupNotFoundError) {
        res.status(404).json({ error: 'popup_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}