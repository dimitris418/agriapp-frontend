import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Farmer } from './farmer';

describe('Farmer', () => {
  let service: Farmer;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(Farmer);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should drop empty filters from the query string', () => {
    service.search({ page: 0, pageSize: 10, lastname: '', username: 'owner' }).subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/farmers'));
    expect(request.request.params.get('lastname')).toBeNull();
    expect(request.request.params.get('username')).toBe('owner');
    request.flush({ data: [], currentPage: 0, pageSize: 10, totalPages: 0, numberOfElements: 0, totalElements: 0 });
  });

  it('should read the current profile from the me endpoint', () => {
    service.getMe().subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/farmers/me'));
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
});
