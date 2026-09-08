import { GenericFilters } from './api.model';
import { UserInsertDTO, UserReadOnlyDTO, UserUpdateDTO } from './user.model';

export interface FarmerInsertDTO {
  registryNumber?: string;
  phone?: string;
  userInsertDTO: UserInsertDTO;
}

export interface FarmerUpdateDTO {
  id: number;
  uuid: string;
  registryNumber?: string;
  phone?: string;
  isActive: boolean;
  userUpdateDTO: UserUpdateDTO;
}

export interface FarmerReadOnlyDTO {
  id: number;
  uuid: string;
  registryNumber: string | null;
  phone: string | null;
  isActive: boolean;
  userReadOnlyDTO: UserReadOnlyDTO;
}

export interface FarmerFilters extends GenericFilters {
  uuid?: string;
  lastname?: string;
  username?: string;
  registryNumber?: string;
  active?: boolean;
}

export interface FarmerStatusUpdateDTO {
  isActive: boolean;
}
