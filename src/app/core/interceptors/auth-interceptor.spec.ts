import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Auth } from '../services/auth';
import { authInterceptor } from './auth-interceptor';

const SESSION_KEY = 'agriapp.session';

function storeSession(): void {
  const payload = { sub: 'farmer@example.com', role: 'FARMER', iat: 0, exp: Date.now() / 1000 + 3600 };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ firstname: 'Γιώργος', lastname: 'Παπαδόπουλος', token: `header.${encoded}.sig` }),
  );
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const configure = () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('should not add a header when there is no session', () => {
    configure();
    http.get(`${environment.apiUrl}/parcels`).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}/parcels`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    httpMock.verify();
  });

  it('should attach the bearer token to api requests', () => {
    storeSession();
    configure();
    http.get(`${environment.apiUrl}/parcels`).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}/parcels`);
    expect(request.request.headers.get('Authorization')).toMatch(/^Bearer header\./);
    request.flush({});
    httpMock.verify();
  });

  it('should leave requests to other hosts untouched', () => {
    storeSession();
    configure();
    http.get('https://example.com/data').subscribe();

    const request = httpMock.expectOne('https://example.com/data');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    httpMock.verify();
  });

  it('should clear the session when the api answers 401', () => {
    storeSession();
    configure();
    const auth = TestBed.inject(Auth);
    expect(auth.isLoggedIn()).toBe(true);

    http.get(`${environment.apiUrl}/parcels`).subscribe({ error: () => undefined });
    httpMock
      .expectOne(`${environment.apiUrl}/parcels`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isLoggedIn()).toBe(false);
    httpMock.verify();
  });
});
