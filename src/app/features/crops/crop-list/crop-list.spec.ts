import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CropList } from './crop-list';

const page = {
  data: [
    {
      id: 1,
      uuid: 'c1',
      parcelReadOnlyDTO: {
        id: 1,
        uuid: 'p1',
        name: 'Κάτω χωράφι',
        location: 'Λάρισα',
        areaInStremmas: 25.5,
        kaek: null,
        isActive: true,
      },
      cropTypeReadOnlyDTO: {
        id: 1,
        name: 'Σκληρό σιτάρι',
        latinName: 'Triticum durum',
        season: 'WINTER',
      },
      variety: 'Σίμετο',
      cultivationYear: 2026,
      plantingDate: '2025-11-10',
      expectedHarvestDate: '2026-06-20',
      harvestDate: null,
    },
  ],
  currentPage: 0,
  pageSize: 10,
  totalPages: 1,
  numberOfElements: 1,
  totalElements: 1,
};

describe('CropList', () => {
  let fixture: ComponentFixture<CropList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CropList);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  const flushInitialRequests = () => {
    httpMock.expectOne((req) => req.url.endsWith('/crops')).flush(page);
    httpMock.expectOne((req) => req.url.endsWith('/parcels')).flush({ ...page, data: [] });
    httpMock.expectOne((req) => req.url.endsWith('/crop-types')).flush([]);
  };

  it('should show the parcel each crop belongs to', async () => {
    flushInitialRequests();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Κάτω χωράφι');
    expect(fixture.nativeElement.textContent).toContain('Σκληρό σιτάρι');
    httpMock.verify();
  });

  it('should mark a crop without a harvest as in progress', async () => {
    flushInitialRequests();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Σε εξέλιξη');
    httpMock.verify();
  });
});
