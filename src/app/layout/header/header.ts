import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  private readonly auth = inject(Auth);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly fullname = this.auth.fullname;

  // Ο διαχειριστής δεν είναι αγρότης: τα endpoints των αγροτεμαχίων ψάχνουν
  // Farmer με το username του και δεν θα τον έβρισκαν ποτέ.
  protected readonly isFarmer = computed(() => this.auth.role() === 'FARMER');
  protected readonly isAdmin = computed(() => this.auth.role() === 'ADMIN');

  protected logout(): void {
    this.auth.logout();
  }
}
