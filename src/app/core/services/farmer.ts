import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated } from '../models/api.model';
import { FarmerFilters, FarmerReadOnlyDTO, FarmerUpdateDTO } from '../models/farmer.model';

@Service()
export class Farmer {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/farmers`;

  getMe(): Observable<FarmerReadOnlyDTO> {
    return this.http.get<FarmerReadOnlyDTO>(`${this.url}/me`);
  }

  updateMe(dto: FarmerUpdateDTO): Observable<FarmerReadOnlyDTO> {
    return this.http.put<FarmerReadOnlyDTO>(`${this.url}/me`, dto);
  }

  // Διαχειριστική λίστα: το back-end απαιτεί MANAGE_USERS.
  search(filters: FarmerFilters): Observable<Paginated<FarmerReadOnlyDTO>> {
    return this.http.get<Paginated<FarmerReadOnlyDTO>>(this.url, { params: toParams(filters) });
  }
}

function toParams(filters: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
