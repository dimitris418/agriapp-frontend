export interface UserInsertDTO {
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  vat: string;
}

export interface UserUpdateDTO {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  password?: string | null;
  vat: string;
}

export interface UserReadOnlyDTO {
  firstname: string;
  lastname: string;
  username: string;
  vat: string;
  role: string;
}
