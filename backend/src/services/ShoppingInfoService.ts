import type Redis from 'ioredis';
import type { ShoppingInfoRepository } from '../repositories/ShoppingInfoRepository';
import { ShoppingInfo } from '../entities/ShoppingInfo';
import type { ShoppingInfoRequestDto, ShoppingInfoResponseDto } from '../dtos/ShoppingInfoDto';
import { validateShoppingInfoPayload } from '../lib/shopping_info';
import { cached } from '../utils/cache';

const CACHE_TTL_SECONDS = 300; // 5 min

function cacheKey(tenantId: string): string {
  return `tenant:info:${tenantId}`;
}

function toResponseDto(info: ShoppingInfo): ShoppingInfoResponseDto {
  return {
    address:         info.address,
    address_lat:     info.addressLat,
    address_lng:     info.addressLng,
    phone:           info.phone,
    phone_secondary: info.phoneSecondary,
    email:           info.email,
    opening_hours:   info.openingHours,
    parking_rates:   info.parkingRates,
    facebook_url:    info.facebookUrl,
    instagram_url:   info.instagramUrl,
    youtube_url:     info.youtubeUrl,
    linkedin_url:    info.linkedinUrl,
    tiktok_url:      info.tiktokUrl,
  };
}

export class ShoppingInfoService {
  constructor(
    private readonly shoppingInfoRepo: ShoppingInfoRepository,
    private readonly redis: Redis,
  ) {}

  /**
   * Retorna dados institucionais do tenant.
   * Usa cache Redis (TTL 5 min). Retorna {} se nunca preenchido — nunca 404.
   */
  async getByTenantId(tenantId: string): Promise<ShoppingInfoResponseDto | Record<string, never>> {
    const { data } = await cached(
      this.redis,
      cacheKey(tenantId),
      CACHE_TTL_SECONDS,
      async () => {
        const info = await this.shoppingInfoRepo.findByTenantId(tenantId);
        return info ? toResponseDto(info) : {};
      },
    );
    return data as ShoppingInfoResponseDto | Record<string, never>;
  }

  /**
   * Valida payload, faz UPSERT e invalida cache.
   * Lança ShoppingInfoValidationError se payload inválido.
   */
  async upsert(
    tenantId: string,
    body: unknown,
  ): Promise<{ ok: true; updated_at: string }> {
    const errors = validateShoppingInfoPayload(body);
    if (errors.length > 0) {
      throw new ShoppingInfoValidationError(errors);
    }

    const data = body as ShoppingInfoRequestDto;
    const saved = await this.shoppingInfoRepo.upsert(tenantId, data);

    await this.redis.del(cacheKey(tenantId)).catch(() => {
      // invalidação best-effort — falha silenciosa
    });

    return {
      ok: true,
      updated_at: saved.updatedAt.toISOString(),
    };
  }
}

export class ShoppingInfoValidationError extends Error {
  constructor(public readonly errors: Array<{ field: string; message: string }>) {
    super('shopping_info_validation_error');
  }
}