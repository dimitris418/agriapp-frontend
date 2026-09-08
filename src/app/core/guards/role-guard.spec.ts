import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { roleGuard } from './role-guard';

const SESSION_KEY = 'agriapp.session';

function storeSession(role: string): void {
  const payload = { sub: 'user@example.com', role, iat: 0, exp: Date.now() / 1000 + 3600 };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ firstname: 'Άννα', lastname: 'Δήμου', token: `header.${encoded}.sig` }),
  );
}

describe('roleGuard', () => {
  const state = { url: '/admin/farmers' } as RouterStateSnapshot;

  const run = () =>
    TestBed.runInInjectionContext(() => roleGuard('ADMIN')({} as never, state));

  const configure = () =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('should redirect to the login page when logged out', () => {
    configure();
    const result = run();

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/login');
  });

  it('should send a farmer back to the home page', () => {
    storeSession('FARMER');
    configure();
    const result = run();

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('should allow the matching role through', () => {
    storeSession('ADMIN');
    configure();

    expect(run()).toBe(true);
  });
});
