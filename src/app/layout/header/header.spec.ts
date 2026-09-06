import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

const SESSION_KEY = 'agriapp.session';

function storeSession(): void {
  const payload = {
    sub: 'farmer@example.com',
    role: 'FARMER',
    iat: 0,
    exp: Date.now() / 1000 + 3600,
  };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      firstname: 'Γιώργος',
      lastname: 'Παπαδόπουλος',
      token: `header.${encoded}.sig`,
    }),
  );
}

describe('Header', () => {
  let fixture: ComponentFixture<Header>;

  const configure = async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('should offer only the login link when logged out', async () => {
    await configure();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.nav')).toBeNull();
    expect(element.textContent).toContain('Σύνδεση');
  });

  it('should show the navigation and the user name when logged in', async () => {
    storeSession();
    await configure();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('.nav a').length).toBe(3);
    expect(element.textContent).toContain('Γιώργος Παπαδόπουλος');
  });
});
