import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ParcelList } from './parcel-list';

const page = {
  data: [
    {
      id: 1,
      uuid: 'a1',
      name: 'Κάτω χωράφι',
      location: 'Λάρισα',
      areaInStremmas: 25.5,
      kaek: null,
      isActive: true,
    },
    {
      id: 2,
      uuid: 'a2',
      name: 'Πάνω χωράφι',
      location: null,
      areaInStremmas: 12,
      kaek: '123456789012',
      isActive: false,
    },
  ],
  currentPage: 0,
  pageSize: 10,
  totalPages: 1,
  numberOfElements: 2,
  totalElements: 2,
};

describe('ParcelList', () => {
  let fixture: ComponentFixture<ParcelList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelList);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should render a row per parcel', async () => {
    httpMock.expectOne((req) => req.url.endsWith('/parcels')).flush(page);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Κάτω χωράφι');
    httpMock.verify();
  });

  it('should show a dash where the location is missing', async () => {
    httpMock.expectOne((req) => req.url.endsWith('/parcels')).flush(page);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('—');
    httpMock.verify();
  });

  it('should show an empty message when there is nothing to list', async () => {
    httpMock
      .expectOne((req) => req.url.endsWith('/parcels'))
      .flush({ ...page, data: [], numberOfElements: 0, totalElements: 0 });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Δεν βρέθηκαν αγροτεμάχια');
    httpMock.verify();
  });
});
