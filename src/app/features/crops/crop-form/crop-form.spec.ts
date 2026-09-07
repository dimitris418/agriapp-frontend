import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CropForm } from './crop-form';

function configure(params: Record<string, string>) {
  return TestBed.configureTestingModule({
    imports: [CropForm],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: 'crops', children: [] }]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap({}) },
        },
      },
    ],
  }).compileComponents();
}

describe('CropForm', () => {
  let fixture: ComponentFixture<CropForm>;
  let httpMock: HttpTestingController;

  it('should load the parcels and the crop types when creating', async () => {
    await configure({});
    fixture = TestBed.createComponent(CropForm);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne((req) => req.url.endsWith('/crop-types')).flush([]);
    httpMock
      .expectOne((req) => req.url.endsWith('/parcels'))
      .flush({ data: [], totalElements: 0 });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Νέα καλλιέργεια');
    httpMock.verify();
  });

  it('should lock the parcel when editing an existing crop', async () => {
    await configure({ uuid: 'c1' });
    fixture = TestBed.createComponent(CropForm);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne((req) => req.url.endsWith('/crop-types')).flush([]);
    httpMock.expectOne((req) => req.url.endsWith('/crops/c1')).flush({
      id: 1,
      uuid: 'c1',
      parcelReadOnlyDTO: {
        id: 1,
        uuid: 'p1',
        name: 'Κάτω χωράφι',
        location: null,
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
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Επεξεργασία καλλιέργειας');
    expect(fixture.nativeElement.textContent).toContain('δεν αλλάζει μετά τη δημιουργία');
    httpMock.verify();
  });
});
