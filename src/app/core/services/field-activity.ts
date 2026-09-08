import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated } from '../models/api.model';
import {
  FieldActivityFilters,
  FieldActivityInsertDTO,
  FieldActivityReadOnlyDTO,
  FieldActivityUpdateDTO,
} from '../models/field-activity.model';

@Service()
export class FieldActivity {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/activities`;

  search(filters: FieldActivityFilters): Observable<Paginated<FieldActivityReadOnlyDTO>> {
    return this.http.get<Paginated<FieldActivityReadOnlyDTO>>(this.url, {
      params: toParams(filters),
    });
  }

  getOne(uuid: string): Observable<FieldActivityReadOnlyDTO> {
    return this.http.get<FieldActivityReadOnlyDTO>(`${this.url}/${uuid}`);
  }

  create(dto: FieldActivityInsertDTO): Observable<FieldActivityReadOnlyDTO> {
    return this.http.post<FieldActivityReadOnlyDTO>(this.url, dto);
  }

  update(dto: FieldActivityUpdateDTO): Observable<FieldActivityReadOnlyDTO> {
    return this.http.put<FieldActivityReadOnlyDTO>(`${this.url}/${dto.uuid}`, dto);
  }

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
