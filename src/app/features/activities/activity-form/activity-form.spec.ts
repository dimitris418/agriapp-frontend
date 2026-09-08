import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ActivityForm } from './activity-form';

const products = [
  {
    id: 1,
    name: 'Μυκητοκτόνο δοκιμής',
    activeSubstance: 'tebuconazole',
    category: 'FUNGICIDE',
    preHarvestIntervalDays: 35,
  },
  {
    id: 2,
    name: 'Λίπασμα δοκιμής',
    activeSubstance: 'N-P-K',
    category: 'FERTILIZER',
    preHarvestIntervalDays: null,
  },
];

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
  expectedHarvestDate: '2026-08-20',
  harvestDate: null,
};

function configure(params: Record<string, string>) {
  return TestBed.configureTestingModule({
    imports: [ActivityForm],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNativeDateAdapter(),
      provideRouter([{ path: 'activities', children: [] }]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap({}) },
        },
      },
    ],
  }).compileComponents();
}

describe('ActivityForm', () => {
  let fixture: ComponentFixture<ActivityForm>;
  let httpMock: HttpTestingController;

  const setType = async (type: string) => {
    fixture.componentInstance.form.controls.type.setValue(type as never);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await configure({});
    fixture = TestBed.createComponent(ActivityForm);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne((req) => req.url.endsWith('/products')).flush(products);
    httpMock.expectOne((req) => req.url.endsWith('/pests')).flush([]);
    httpMock.expectOne((req) => req.url.endsWith('/crops')).flush({ data: [crop], totalElements: 1 });
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('should require a product and a dose for a spraying', async () => {
    await setType('SPRAYING');

    expect(fixture.componentInstance.form.controls.productId.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.quantity.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.pestId.hasError('required')).toBe(false);
  });

  it('should offer only plant protection products for a spraying', async () => {
    await setType('SPRAYING');

    expect(fixture.nativeElement.textContent).not.toContain('Λίπασμα δοκιμής');
  });

  it('should offer only fertilisers for a fertilisation', async () => {
    await setType('FERTILIZATION');

    expect(fixture.componentInstance.form.controls.productId.hasError('required')).toBe(true);
  });

  it('should require a pest and a severity for an observation, and no product', async () => {
    await setType('OBSERVATION');

    expect(fixture.componentInstance.form.controls.pestId.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.severity.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.productId.hasError('required')).toBe(false);
    expect(fixture.componentInstance.form.controls.quantity.hasError('required')).toBe(false);
  });

  it('should ask only for a quantity when irrigating', async () => {
    await setType('IRRIGATION');

    expect(fixture.componentInstance.form.controls.quantity.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.unit.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.productId.hasError('required')).toBe(false);
  });

  it('should clear the product when switching from a spraying to an irrigation', async () => {
    await setType('SPRAYING');
    fixture.componentInstance.form.controls.productId.setValue(1);
    await setType('IRRIGATION');

    expect(fixture.componentInstance.form.controls.productId.value).toBeNull();
  });

  it('should warn when the expected harvest falls inside the pre-harvest interval', async () => {
    fixture.componentInstance.form.controls.cropUuid.setValue('c1');
    await setType('SPRAYING');
    fixture.componentInstance.form.controls.productId.setValue(1);
    fixture.componentInstance.form.controls.activityDate.setValue(new Date(2026, 7, 1));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Προσοχή στον χρόνο αναμονής');
    expect(fixture.nativeElement.textContent).toContain('05/09/2026');
  });

  it('should stay silent when the interval ends before the expected harvest', async () => {
    fixture.componentInstance.form.controls.cropUuid.setValue('c1');
    await setType('SPRAYING');
    fixture.componentInstance.form.controls.productId.setValue(1);
    fixture.componentInstance.form.controls.activityDate.setValue(new Date(2026, 5, 1));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Προσοχή στον χρόνο αναμονής');
  });
});
