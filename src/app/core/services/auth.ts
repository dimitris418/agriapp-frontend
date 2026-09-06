import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthenticationRequest, AuthenticationResponse, JwtPayload } from '../models/auth.model';
import { FarmerInsertDTO, FarmerReadOnlyDTO } from '../models/farmer.model';

const SESSION_KEY = 'agriapp.session';

@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<AuthenticationResponse | null>(this.restore());

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly role = computed(() => this.claims()?.role ?? null);
  readonly username = computed(() => this.claims()?.sub ?? null);
  readonly fullname = computed(() => {
    const session = this.session();
    return session ? `${session.firstname} ${session.lastname}` : null;
  });

  login(credentials: AuthenticationRequest): Observable<AuthenticationResponse> {
    return this.http
      .post<AuthenticationResponse>(`${environment.apiUrl}/auth/authenticate`, credentials)
      .pipe(tap((response) => this.store(response)));
  }

  register(dto: FarmerInsertDTO): Observable<FarmerReadOnlyDTO> {
    return this.http.post<FarmerReadOnlyDTO>(`${environment.apiUrl}/farmers`, dto);
  }

  logout(): void {
    this.discard();
    this.session.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return this.session()?.token ?? null;
  }

  private store(response: AuthenticationResponse): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(response));
    this.session.set(response);
  }

  // Η συνεδρία κρατιέται στο localStorage ώστε να επιβιώνει του refresh. Το
  // κόστος είναι ότι ένα XSS θα μπορούσε να διαβάσει το token· η εναλλακτική
  // του httpOnly cookie απαιτεί αλλαγές στο back-end και προστασία CSRF.
  private restore(): AuthenticationResponse | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as AuthenticationResponse;
      if (this.isExpired(session.token)) {
        this.discard();
        return null;
      }
      return session;
    } catch {
      this.discard();
      return null;
    }
  }

  private discard(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  private claims(): JwtPayload | null {
    const token = this.session()?.token;
    return token ? decodeToken(token) : null;
  }

  private isExpired(token: string): boolean {
    const claims = decodeToken(token);
    return claims === null || claims.exp * 1000 <= Date.now();
  }
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
  } catch {
    return null;
  }
}
