export interface CropTypeReadOnlyDTO {
  id: number;
  name: string;
  latinName: string;
  season: string;
}

export interface ProductReadOnlyDTO {
  id: number;
  name: string;
  activeSubstance: string;
  category: string;
  preHarvestIntervalDays: number | null;
}

export interface PestReadOnlyDTO {
  id: number;
  name: string;
  latinName: string | null;
  type: string;
}

export interface RegionReadOnlyDTO {
  id: number;
  name: string;
}

export interface RegionalUnitReadOnlyDTO {
  id: number;
  name: string;
  regionReadOnlyDTO: RegionReadOnlyDTO;
}
