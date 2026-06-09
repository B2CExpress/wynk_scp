import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export interface OpeningHourSlot {
  open: string;  // HH:MM
  close: string; // HH:MM
}

export interface OpeningHourDays {
  weekdays?: OpeningHourSlot;
  saturday?: OpeningHourSlot;
  sunday?: OpeningHourSlot;
  holidays?: OpeningHourSlot;
}

export interface OpeningHours {
  [area: string]: OpeningHourDays; // ex: stores, food_court, theater
}

export interface ParkingRate {
  label: string;
  value: string;
}

@Entity({ schema: 'scp', name: 'shopping_info' })
export class ShoppingInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'address', type: 'text' })
  address: string;

  @Column({ name: 'address_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  addressLat: number | null;

  @Column({ name: 'address_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  addressLng: number | null;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'phone_secondary', type: 'varchar', length: 20, nullable: true })
  phoneSecondary: string | null;

  @Column({ name: 'email', type: 'varchar', length: 200 })
  email: string;

  @Column({ name: 'opening_hours', type: 'jsonb', default: '{}' })
  openingHours: OpeningHours;

  @Column({ name: 'parking_rates', type: 'jsonb', default: '[]' })
  parkingRates: ParkingRate[];

  @Column({ name: 'facebook_url', type: 'text', nullable: true })
  facebookUrl: string | null;

  @Column({ name: 'instagram_url', type: 'text', nullable: true })
  instagramUrl: string | null;

  @Column({ name: 'youtube_url', type: 'text', nullable: true })
  youtubeUrl: string | null;

  @Column({ name: 'linkedin_url', type: 'text', nullable: true })
  linkedinUrl: string | null;

  @Column({ name: 'tiktok_url', type: 'text', nullable: true })
  tiktokUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}