import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ActivityList } from './activity-list';

const crop = {
  id: 1,
  uuid: 'c1',
  parcelReadOnlyDTO: {
    id: 1,
    uuid: 'p1',
    name: 'Κάτω χωράφι',
    regionalUnitReadOnlyDTO: null,
    areaInStremmas: 25.5,
    kaek: null,
    isActive: true,
  },
  cropTypeReadOnlyDTO: { id: 1, name: 'Σκληρό σιτάρι', latinName: 'T. durum', season: 'WINTER' },
  variety: 'Σίμετο',
  cultivationYear: 2026,
  plantingDate: null,
  expectedHarvestDate: null,
  harvestDate: null,
};

const page = {
  data: [
    {
      id: 1,
      uuid: 'a1',
      cropReadOnlyDTO: crop,
      activityDate: '2026-05-01',
      type: 'SPRAYING',
      productReadOnlyDTO: {
        id: 1,
        name: 'Μυκητοκτόνο δοκιμής',
        activeSubstance: 'tebuconazole',
        category: 'FUNGICIDE',
        preHarvestIntervalDays: 35,
      },
      quantity: 1.5,
      unit: 'LITRE',
      pestReadOnlyDTO: null,
      severity: null,
      notes: null,
    },
  ],
  currentPage: 0,
  pageSize: 10,
  totalPages: 1,
  numberOfElements: 1,
  totalElements: 1,
};

describe('ActivityList', () => {
  let fixture: ComponentFixture<ActivityList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityList);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne((req) => req.url.endsWith('/crops')).flush({ data: [], totalElements: 0 });
    httpMock.expectOne((req) => req.url.endsWith('/activities')).flush(page);
  });

  afterEach(() => httpMock.verify());

  it('should show the parcel and the crop of each entry', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Κάτω χωράφι');
    expect(fixture.nativeElement.textContent).toContain('Σκληρό σιτάρι');
  });

  it('should translate the activity type into Greek', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Ψεκασμός');
  });

  it('should summarise the product and the dose in one cell', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Μυκητοκτόνο δοκιμής · 1.5 λίτρα');
  });
});
