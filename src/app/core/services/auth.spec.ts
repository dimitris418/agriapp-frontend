import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthenticationResponse } from '../models/auth.model';
import { Auth } from './auth';

const SESSION_KEY = 'agriapp.session';

function tokenExpiringAt(epochSeconds: number): string {
  const payload = { sub: 'farmer@example.com', role: 'FARMER', iat: 0, exp: epochSeconds };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${encoded}.signature`;
}

function sessionWith(token: string): AuthenticationResponse {
  return { firstname: 'Γιώργος', lastname: 'Παπαδόπουλος', token };
}

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  const configure = () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('should start logged out when nothing is stored', () => {
    configure();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.fullname()).toBeNull();
  });

  it('should expose the session after a successful login', () => {
    configure();
    const response = sessionWith(tokenExpiringAt(Date.now() / 1000 + 3600));

    service.login({ username: 'farmer@example.com', password: 'Agri2026!' }).subscribe();
    httpMock.expectOne((req) => req.url.endsWith('/auth/authenticate')).flush(response);

    expect(service.isLoggedIn()).toBe(true);
    expect(service.fullname()).toBe('Γιώργος Παπαδόπουλος');
    expect(service.role()).toBe('FARMER');
    expect(service.username()).toBe('farmer@example.com');
    httpMock.verify();
  });

  it('should restore a stored session that has not expired', () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(sessionWith(tokenExpiringAt(Date.now() / 1000 + 3600))),
    );
    configure();

    expect(service.isLoggedIn()).toBe(true);
  });

  it('should discard a stored session whose token has expired', () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(sessionWith(tokenExpiringAt(Date.now() / 1000 - 60))),
    );
    configure();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('should clear the session on logout', () => {
    configure();
    service.login({ username: 'farmer@example.com', password: 'Agri2026!' }).subscribe();
    httpMock
      .expectOne((req) => req.url.endsWith('/auth/authenticate'))
      .flush(sessionWith(tokenExpiringAt(Date.now() / 1000 + 3600)));

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    httpMock.verify();
  });
});
