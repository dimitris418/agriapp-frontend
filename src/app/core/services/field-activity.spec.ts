import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FieldActivity } from './field-activity';

describe('FieldActivity', () => {
  let service: FieldActivity;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FieldActivity);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should pass the type and the date range through as query parameters', () => {
    service
      .search({ page: 0, pageSize: 10, type: 'SPRAYING', dateFrom: '2026-01-01', dateTo: '' })
      .subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/activities'));
    expect(request.request.params.get('type')).toBe('SPRAYING');
    expect(request.request.params.get('dateFrom')).toBe('2026-01-01');
    expect(request.request.params.has('dateTo')).toBe(false);
    request.flush({ data: [], totalElements: 0 });
  });

  it('should put to the uuid of the activity being updated', () => {
    service
      .update({ id: 1, uuid: 'a1', activityDate: '2026-05-01', type: 'IRRIGATION', quantity: 30 })
      .subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/activities/a1'));
    expect(request.request.method).toBe('PUT');
    request.flush({});
  });
});
