import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Crop } from './crop';

describe('Crop', () => {
  let service: Crop;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Crop);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should omit empty filters from the query string', () => {
    service.search({ page: 0, pageSize: 10, parcelUuid: '', cultivationYear: 2026 }).subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/crops'));
    expect(request.request.params.has('parcelUuid')).toBe(false);
    expect(request.request.params.get('cultivationYear')).toBe('2026');
    request.flush({ data: [], totalElements: 0 });
  });

  it('should delete by uuid', () => {
    service.delete('abc').subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/crops/abc'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
