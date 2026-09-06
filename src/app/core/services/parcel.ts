import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated } from '../models/api.model';
import {
  ParcelFilters,
  ParcelInsertDTO,
  ParcelReadOnlyDTO,
  ParcelUpdateDTO,
} from '../models/parcel.model';

@Service()
export class Parcel {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/parcels`;

  search(filters: ParcelFilters): Observable<Paginated<ParcelReadOnlyDTO>> {
    return this.http.get<Paginated<ParcelReadOnlyDTO>>(this.url, { params: toParams(filters) });
  }

  getOne(uuid: string): Observable<ParcelReadOnlyDTO> {
    return this.http.get<ParcelReadOnlyDTO>(`${this.url}/${uuid}`);
  }

  create(dto: ParcelInsertDTO): Observable<ParcelReadOnlyDTO> {
    return this.http.post<ParcelReadOnlyDTO>(this.url, dto);
  }

  update(dto: ParcelUpdateDTO): Observable<ParcelReadOnlyDTO> {
    return this.http.put<ParcelReadOnlyDTO>(`${this.url}/${dto.uuid}`, dto);
  }

  // Το back-end κάνει λογική διαγραφή: το αγροτεμάχιο απενεργοποιείται και
  // παραμένει ανακτήσιμο, γιατί κουβαλάει καλλιέργειες και εργασίες.
  deactivate(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${uuid}`);
  }
}

// Κενές τιμές δεν πρέπει να φτάνουν ως query parameters — το back-end θα τις
// δεχόταν ως φίλτρα με κενό περιεχόμενο και δεν θα επέστρεφε τίποτα.
function toParams(filters: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
