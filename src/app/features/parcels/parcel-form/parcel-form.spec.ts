import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ParcelForm } from './parcel-form';

function configure(params: Record<string, string>) {
  return TestBed.configureTestingModule({
    imports: [ParcelForm],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: 'parcels', children: [] }]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(params) } },
      },
    ],
  }).compileComponents();
}

describe('ParcelForm', () => {
  let fixture: ComponentFixture<ParcelForm>;
  let httpMock: HttpTestingController;

  const fill = (values: Record<string, string>) => {
    const inputs: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll('input[formcontrolname]');
    inputs.forEach((input) => {
      const name = input.getAttribute('formcontrolname') as string;
      if (name in values) {
        input.value = values[name];
        input.dispatchEvent(new Event('input'));
      }
    });
  };

  it('should post a new parcel when there is no uuid in the route', async () => {
    await configure({});
    fixture = TestBed.createComponent(ParcelForm);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url.endsWith('/regional-units')).flush([]);
    await fixture.whenStable();

    fill({ name: 'Κάτω χωράφι', areaInStremmas: '25.5', kaek: '' });
    await fixture.whenStable();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    const request = httpMock.expectOne((req) => req.url.endsWith('/parcels'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body.name).toBe('Κάτω χωράφι');
    expect(request.request.body.kaek).toBeUndefined();
    request.flush({});
    httpMock.verify();
  });

  it('should load the parcel and switch to edit mode when a uuid is present', async () => {
    await configure({ uuid: 'a1' });
    fixture = TestBed.createComponent(ParcelForm);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url.endsWith('/regional-units')).flush([]);

    httpMock.expectOne((req) => req.url.endsWith('/parcels/a1')).flush({
      id: 1,
      uuid: 'a1',
      name: 'Κάτω χωράφι',
      regionalUnitReadOnlyDTO: null,
      areaInStremmas: 25.5,
      kaek: null,
      isActive: true,
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Επεξεργασία αγροτεμαχίου');
    httpMock.verify();
  });

  it('should reject a kaek that is not twelve digits', async () => {
    await configure({});
    fixture = TestBed.createComponent(ParcelForm);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url.endsWith('/regional-units')).flush([]);
    await fixture.whenStable();

    fill({ name: 'Κάτω χωράφι', areaInStremmas: '25.5', kaek: '123' });
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
    httpMock.verify();
  });
});
