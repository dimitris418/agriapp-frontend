import { GenericFilters } from './api.model';
import { RegionalUnitReadOnlyDTO } from './lookup.model';

export interface ParcelInsertDTO {
  name: string;
  regionalUnitId?: number;
  areaInStremmas: number;
  kaek?: string;
  isActive: boolean;
}

export interface ParcelUpdateDTO {
  id: number;
  uuid: string;
  name: string;
  regionalUnitId?: number;
  areaInStremmas: number;
  kaek?: string;
  isActive: boolean;
}

export interface ParcelReadOnlyDTO {
  id: number;
  uuid: string;
  name: string;
  regionalUnitReadOnlyDTO: RegionalUnitReadOnlyDTO | null;
  areaInStremmas: number;
  kaek: string | null;
  isActive: boolean;
}

export interface ParcelFilters extends GenericFilters {
  uuid?: string;
  name?: string;
  regionalUnitId?: number;
  kaek?: string;
  active?: boolean;
}
