import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

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
  {
    path: 'crops',
    canActivate: [authGuard],
    loadComponent: () => import('./features/crops/crop-list/crop-list').then((m) => m.CropList),
  },
  {
    path: 'crops/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/crops/crop-form/crop-form').then((m) => m.CropForm),
  },
  {
    path: 'crops/:uuid',
    canActivate: [authGuard],
    loadComponent: () => import('./features/crops/crop-form/crop-form').then((m) => m.CropForm),
  },
  {
    path: 'activities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/activities/activity-list/activity-list').then((m) => m.ActivityList),
  },
  {
    path: 'activities/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/activities/activity-form/activity-form').then((m) => m.ActivityForm),
  },
  {
    path: 'activities/:uuid',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/activities/activity-form/activity-form').then((m) => m.ActivityForm),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'admin/farmers',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/farmer-list/farmer-list').then((m) => m.FarmerList),
  },
  { path: '**', redirectTo: '' },
];
