import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Parcel } from './parcel';

describe('Parcel', () => {
  let service: Parcel;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Parcel);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should omit empty filters from the query string', () => {
    service.search({ page: 0, pageSize: 10, name: '', active: true }).subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/parcels'));
    expect(request.request.params.has('name')).toBe(false);
    expect(request.request.params.get('active')).toBe('true');
    expect(request.request.params.get('pageSize')).toBe('10');
    request.flush({ data: [], totalElements: 0 });
  });

  it('should put to the uuid of the parcel being updated', () => {
    service
      .update({
        id: 1,
        uuid: 'abc',
        name: 'Κάτω χωράφι',
        areaInStremmas: 25.5,
        isActive: true,
      })
      .subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/parcels/abc'));
    expect(request.request.method).toBe('PUT');
    request.flush({});
  });

  it('should deactivate through delete', () => {
    service.deactivate('abc').subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/parcels/abc'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
