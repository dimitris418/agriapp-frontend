import { GenericFilters } from './api.model';
import { CropReadOnlyDTO } from './crop.model';
import { ActivityType, SeverityLevel, UnitOfMeasure } from './enums';
import { PestReadOnlyDTO, ProductReadOnlyDTO } from './lookup.model';

export interface FieldActivityInsertDTO {
  cropUuid: string;
  activityDate: string;
  type: ActivityType;
  productId?: number;
  quantity?: number;
  unit?: UnitOfMeasure;
  pestId?: number;
  severity?: SeverityLevel;
  notes?: string;
}

export interface FieldActivityUpdateDTO {
  id: number;
  uuid: string;
  activityDate: string;
  type: ActivityType;
  productId?: number;
  quantity?: number;
  unit?: UnitOfMeasure;
  pestId?: number;
  severity?: SeverityLevel;
  notes?: string;
}

export interface FieldActivityReadOnlyDTO {
  id: number;
  uuid: string;
  cropReadOnlyDTO: CropReadOnlyDTO;
  activityDate: string;
  type: ActivityType;
  productReadOnlyDTO: ProductReadOnlyDTO | null;
  quantity: number | null;
  unit: UnitOfMeasure | null;
  pestReadOnlyDTO: PestReadOnlyDTO | null;
  severity: SeverityLevel | null;
  notes: string | null;
}

export interface FieldActivityFilters extends GenericFilters {
  uuid?: string;
  cropUuid?: string;
  type?: ActivityType;
  dateFrom?: string;
  dateTo?: string;
}
