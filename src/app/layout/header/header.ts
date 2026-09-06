import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {}
