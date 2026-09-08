import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Profile } from './profile';

const me = {
  id: 1,
  uuid: 'f1',
  registryNumber: '123456',
  phone: '6912345678',
  isActive: true,
  userReadOnlyDTO: {
    id: 11,
    firstname: 'Δημήτρης',
    lastname: 'Παπαδάκης',
    username: 'owner@example.com',
    vat: '123456789',
    role: 'FARMER',
  },
};

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url.endsWith('/farmers/me')).flush(me);
    await fixture.whenStable();
  });

  it('should load the current profile into the form', () => {
    expect(fixture.nativeElement.textContent).toContain('owner@example.com');

    const vat: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[formcontrolname="vat"]',
    );
    expect(vat.value).toBe('123456789');
  });

  it('should keep the username and send no password when the field is left empty', async () => {
    fill({ firstname: 'Δημήτριος', phone: '6900000000' });
    await fixture.whenStable();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    const request = httpMock.expectOne((req) => req.url.endsWith('/farmers/me'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.userUpdateDTO.firstname).toBe('Δημήτριος');
    expect(request.request.body.userUpdateDTO.username).toBe('owner@example.com');
    expect(request.request.body.userUpdateDTO.password).toBeNull();
    expect(request.request.body.phone).toBe('6900000000');
    request.flush(me);
    httpMock.verify();
  });

  it('should refuse to submit a phone number that is not ten digits', async () => {
    fill({ phone: '123' });
    await fixture.whenStable();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    httpMock.verify();
  });
});
