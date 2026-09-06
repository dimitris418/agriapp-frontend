import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth-guard';

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

describe('authGuard', () => {
  const run: CanActivateFn = (...params) =>
    TestBed.runInInjectionContext(() => authGuard(...params));

  const state = { url: '/parcels' } as RouterStateSnapshot;

  const configure = () =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('should redirect to the login page when logged out', () => {
    configure();
    const result = run({} as never, state);

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/login');
    expect((result as UrlTree).toString()).toContain('returnUrl');
  });

  it('should allow access when logged in', () => {
    storeSession();
    configure();

    expect(run({} as never, state)).toBe(true);
  });
});
