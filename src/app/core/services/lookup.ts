import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CropSeason, PestType, ProductCategory } from '../models/enums';
import {
  CropTypeReadOnlyDTO,
  PestReadOnlyDTO,
  ProductReadOnlyDTO,
  RegionalUnitReadOnlyDTO,
} from '../models/lookup.model';

@Service()
export class Lookup {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/lookups`;

  // Οι κατάλογοι είναι σταθεροί όσο τρέχει η εφαρμογή, οπότε το αποτέλεσμα
  // μοιράζεται σε όσους το ζητήσουν αντί να ξαναφορτώνεται σε κάθε φόρμα.
  private cropTypes$?: Observable<CropTypeReadOnlyDTO[]>;
  private regionalUnits$?: Observable<RegionalUnitReadOnlyDTO[]>;

  getCropTypes(season?: CropSeason): Observable<CropTypeReadOnlyDTO[]> {
    if (season) {
      return this.http.get<CropTypeReadOnlyDTO[]>(`${this.url}/crop-types`, {
        params: new HttpParams().set('season', season),
      });
    }

    this.cropTypes$ ??= this.http
      .get<CropTypeReadOnlyDTO[]>(`${this.url}/crop-types`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    return this.cropTypes$;
  }

  getProducts(category?: ProductCategory): Observable<ProductReadOnlyDTO[]> {
    return this.http.get<ProductReadOnlyDTO[]>(`${this.url}/products`, {
      params: category ? new HttpParams().set('category', category) : new HttpParams(),
    });
  }

  getPests(type?: PestType): Observable<PestReadOnlyDTO[]> {
    return this.http.get<PestReadOnlyDTO[]>(`${this.url}/pests`, {
      params: type ? new HttpParams().set('type', type) : new HttpParams(),
    });
  }

  getRegionalUnits(): Observable<RegionalUnitReadOnlyDTO[]> {
    this.regionalUnits$ ??= this.http
      .get<RegionalUnitReadOnlyDTO[]>(`${this.url}/regional-units`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    return this.regionalUnits$;
  }
}
