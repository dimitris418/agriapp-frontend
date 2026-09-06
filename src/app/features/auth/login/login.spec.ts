import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable the submit button while the form is invalid', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  it('should show a message when the credentials are rejected', async () => {
    const inputs: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('input');
    inputs[0].value = 'farmer@example.com';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'wrong';
    inputs[1].dispatchEvent(new Event('input'));
    await fixture.whenStable();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/authenticate'))
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Λάθος όνομα χρήστη ή κωδικός');
    httpMock.verify();
  });
});
