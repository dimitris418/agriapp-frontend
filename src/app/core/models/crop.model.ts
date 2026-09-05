import { GenericFilters } from './api.model';
import { CropTypeReadOnlyDTO } from './lookup.model';

export interface CropInsertDTO {
  parcelUuid: string;
  cropTypeId: number;
  variety?: string;
  cultivationYear: number;
  plantingDate?: string;
  expectedHarvestDate?: string;
}

export interface CropUpdateDTO {
  id: number;
  uuid: string;
  cropTypeId: number;
  variety?: string;
  cultivationYear: number;
  plantingDate?: string;
  expectedHarvestDate?: string;
}

export interface CropReadOnlyDTO {
  id: number;
  uuid: string;
  cropTypeReadOnlyDTO: CropTypeReadOnlyDTO;
  variety: string | null;
  cultivationYear: number;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  harvestDate: string | null;
}

export interface CropFilters extends GenericFilters {
  uuid?: string;
  parcelUuid?: string;
  cropTypeId?: number;
  cultivationYear?: number;
}
