import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(Auth);

  protected readonly fullname = this.auth.fullname;
}
