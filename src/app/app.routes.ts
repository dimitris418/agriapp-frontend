import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'parcels',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parcels/parcel-list/parcel-list').then((m) => m.ParcelList),
  },
  // Η σειρά μετράει: το 'new' πρέπει να ταιριάξει πριν το ':uuid'.
  {
    path: 'parcels/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parcels/parcel-form/parcel-form').then((m) => m.ParcelForm),
  },
  {
    path: 'parcels/:uuid',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parcels/parcel-form/parcel-form').then((m) => m.ParcelForm),
  },
  { path: '**', redirectTo: '' },
];
