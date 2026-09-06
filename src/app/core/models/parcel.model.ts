import { GenericFilters } from './api.model';

export interface ParcelInsertDTO {
  name: string;
  location?: string;
  areaInStremmas: number;
  kaek?: string;
  isActive: boolean;
}

export interface ParcelUpdateDTO {
  id: number;
  uuid: string;
  name: string;
  location?: string;
  areaInStremmas: number;
  kaek?: string;
  isActive: boolean;
}

export interface ParcelReadOnlyDTO {
  id: number;
  uuid: string;
  name: string;
  location: string | null;
  areaInStremmas: number;
  kaek: string | null;
  isActive: boolean;
}

export interface ParcelFilters extends GenericFilters {
  uuid?: string;
  name?: string;
  location?: string;
  kaek?: string;
  active?: boolean;
}
