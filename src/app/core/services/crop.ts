import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated } from '../models/api.model';
import { CropFilters, CropInsertDTO, CropReadOnlyDTO, CropUpdateDTO } from '../models/crop.model';

@Service()
export class Crop {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/crops`;

  search(filters: CropFilters): Observable<Paginated<CropReadOnlyDTO>> {
    return this.http.get<Paginated<CropReadOnlyDTO>>(this.url, { params: toParams(filters) });
  }

  getOne(uuid: string): Observable<CropReadOnlyDTO> {
    return this.http.get<CropReadOnlyDTO>(`${this.url}/${uuid}`);
  }

  create(dto: CropInsertDTO): Observable<CropReadOnlyDTO> {
    return this.http.post<CropReadOnlyDTO>(this.url, dto);
  }

  update(dto: CropUpdateDTO): Observable<CropReadOnlyDTO> {
    return this.http.put<CropReadOnlyDTO>(`${this.url}/${dto.uuid}`, dto);
  }

  // Πραγματική διαγραφή, σε αντίθεση με το αγροτεμάχιο -- το back-end την
  // επιτρέπει μόνο όσο η καλλιέργεια δεν έχει εγγραφές στο ημερολόγιο.
  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${uuid}`);
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
