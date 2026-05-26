import type { Request, Response } from 'express';
import type { BannerService } from '../services/banner.service';
import { BannerNotFoundError } from '../services/banner.service';
import {
  validateBannerInput,
  parseBannerInput,
  parseBannerReorderInput,
} from '../dtos/banner.dto';

export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  async listBanners(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.bannerService.listForCurrentTenant();
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const banner = await this.bannerService.getByIdForCurrentTenant(id);
      res.json(banner);
    } catch (error) {
      if (error instanceof BannerNotFoundError) {
        res.status(404).json({ error: 'banner_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async createBanner(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body;
      const parsed = parseBannerInput(input);

      const errors = validateBannerInput(parsed);
      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const banner = await this.bannerService.createForCurrentTenant(parsed);
      res.status(201).json(banner);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body;
      const parsed = parseBannerInput(input);

      const errors = validateBannerInput(parsed);
      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const banner = await this.bannerService.updateForCurrentTenant(id, parsed);
      res.json(banner);
    } catch (error) {
      if (error instanceof BannerNotFoundError) {
        res.status(404).json({ error: 'banner_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async deleteBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.bannerService.deleteForCurrentTenant(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof BannerNotFoundError) {
        res.status(404).json({ error: 'banner_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async reorderBanners(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body;
      const parsed = parseBannerReorderInput(input);

      if (!parsed || !Array.isArray(parsed.order) || parsed.order.length === 0) {
        res.status(400).json({ errors: [{ field: 'order', message: 'Order must be a non-empty array' }] });
        return;
      }

      // Validate each order entry
      const errors = [];
      for (let i = 0; i < parsed.order.length; i++) {
        const item = parsed.order[i];
        if (!item.id) {
          errors.push({ field: `order[${i}].id`, message: 'Banner ID is required' });
        }
        if (item.sort_order === null || item.sort_order < 0) {
          errors.push({ field: `order[${i}].sort_order`, message: 'Sort order must be >= 0' });
        }
      }

      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const result = await this.bannerService.reorderForCurrentTenant(parsed.order);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async toggleBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.bannerService.toggleForCurrentTenant(id);
      res.json(result);
    } catch (error) {
      if (error instanceof BannerNotFoundError) {
        res.status(404).json({ error: 'banner_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
