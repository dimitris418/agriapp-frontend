import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
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

  const valid = {
    firstname: 'Γιώργος',
    lastname: 'Παπαδόπουλος',
    username: 'farmer@example.com',
    password: 'Agri2026!',
    confirmPassword: 'Agri2026!',
    vat: '123456789',
    registryNumber: '',
    phone: '',
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the submit button disabled while the form is empty', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  it('should reject mismatched passwords', async () => {
    fill({ ...valid, confirmPassword: 'Different1!' });
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
    httpMock.verify();
  });

  it('should send a nested farmer payload when the form is valid', async () => {
    fill(valid);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    const request = httpMock.expectOne((req) => req.url.endsWith('/farmers'));
    expect(request.request.body.userInsertDTO.username).toBe('farmer@example.com');
    expect(request.request.body.userInsertDTO.vat).toBe('123456789');
    expect(request.request.body.registryNumber).toBeUndefined();
    request.flush({});
    httpMock.verify();
  });

  it('should show a message when the email or the vat is taken', async () => {
    fill(valid);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    httpMock
      .expectOne((req) => req.url.endsWith('/farmers'))
      .flush(
        { code: 'UserAlreadyExists', description: 'User with vat 123456789 already exists' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Υπάρχει ήδη λογαριασμός');
    httpMock.verify();
  });
});
