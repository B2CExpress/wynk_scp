import { OpeningHours, ParkingRate } from '../entities/ShoppingInfo';

export interface ShoppingInfoResponseDto {
  address: string;
  address_lat: number | null;
  address_lng: number | null;
  phone: string;
  phone_secondary: string | null;
  email: string;
  opening_hours: OpeningHours;
  parking_rates: ParkingRate[];
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  tiktok_url: string | null;
}

export interface ShoppingInfoRequestDto {
  address: string;
  address_lat?: number | null;
  address_lng?: number | null;
  phone: string;
  phone_secondary?: string | null;
  email: string;
  opening_hours: OpeningHours;
  parking_rates: ParkingRate[];
  facebook_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  linkedin_url?: string | null;
  tiktok_url?: string | null;
}

export interface ShoppingInfoUpdateResponseDto {
  ok: true;
  updated_at: string; // ISO string
}

export interface ValidationError {
  field: string;
  message: string;
}