import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Lookup } from './lookup';

describe('Lookup', () => {
  let service: Lookup;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Lookup);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch the crop types once and share the result', () => {
    service.getCropTypes().subscribe();
    service.getCropTypes().subscribe();

    httpMock.expectOne((req) => req.url.endsWith('/crop-types')).flush([]);
  });

  it('should not cache when a season is requested', () => {
    service.getCropTypes('SPRING').subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/crop-types'));
    expect(request.request.params.get('season')).toBe('SPRING');
    request.flush([]);
  });

  it('should pass the category through to the products endpoint', () => {
    service.getProducts('FERTILIZER').subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/products'));
    expect(request.request.params.get('category')).toBe('FERTILIZER');
    request.flush([]);
  });
});
