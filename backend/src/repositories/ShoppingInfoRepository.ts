import type { DataSource, Repository } from 'typeorm';
import { ShoppingInfo } from '../entities/ShoppingInfo';
import type { ShoppingInfoRequestDto } from '../dtos/ShoppingInfoDto';

export class ShoppingInfoRepository {
  private readonly repo: Repository<ShoppingInfo>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ShoppingInfo);
  }

  async findByTenantId(tenantId: string): Promise<ShoppingInfo | null> {
    return this.repo.findOne({ where: { tenantId } });
  }

  async upsert(tenantId: string, data: ShoppingInfoRequestDto): Promise<ShoppingInfo> {
    const existing = await this.repo.findOne({ where: { tenantId } });

    if (existing) {
      this.repo.merge(existing, {
        address:        data.address,
        addressLat:     data.address_lat ?? null,
        addressLng:     data.address_lng ?? null,
        phone:          data.phone,
        phoneSecondary: data.phone_secondary ?? null,
        email:          data.email,
        openingHours:   data.opening_hours,
        parkingRates:   data.parking_rates,
        facebookUrl:    data.facebook_url ?? null,
        instagramUrl:   data.instagram_url ?? null,
        youtubeUrl:     data.youtube_url ?? null,
        linkedinUrl:    data.linkedin_url ?? null,
        tiktokUrl:      data.tiktok_url ?? null,
      });
      return this.repo.save(existing);
    }

    const created = this.repo.create({
      tenantId,
      address:        data.address,
      addressLat:     data.address_lat ?? null,
      addressLng:     data.address_lng ?? null,
      phone:          data.phone,
      phoneSecondary: data.phone_secondary ?? null,
      email:          data.email,
      openingHours:   data.opening_hours,
      parkingRates:   data.parking_rates,
      facebookUrl:    data.facebook_url ?? null,
      instagramUrl:   data.instagram_url ?? null,
      youtubeUrl:     data.youtube_url ?? null,
      linkedinUrl:    data.linkedin_url ?? null,
      tiktokUrl:      data.tiktok_url ?? null,
    });
    return this.repo.save(created);
  }
}