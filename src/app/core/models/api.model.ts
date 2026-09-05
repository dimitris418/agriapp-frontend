export interface Paginated<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  numberOfElements: number;
  totalElements: number;
}

export interface ResponseMessage {
  code: string;
  description: string;
}

// Οι παραβιάσεις επικύρωσης δεν έρχονται ως ResponseMessage αλλά ως επίπεδος
// χάρτης πεδίο -> μήνυμα, όπως τον παράγει ο ErrorHandler του back-end.
export type ValidationErrors = Record<string, string>;

export interface GenericFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
