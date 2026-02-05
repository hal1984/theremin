import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: async () => import('./features/play/play.routes').then((m) => m.playRoutes),
  },
  {
    path: 'play',
    loadChildren: async () => import('./features/play/play.routes').then((m) => m.playRoutes),
  },
  {
    path: 'recordings',
    loadChildren: async () =>
      import('./features/recordings/recordings.routes').then((m) => m.recordingsRoutes),
  },
  {
    path: 'settings',
    loadChildren: async () =>
      import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
  },
  {
    path: 'about',
    loadChildren: async () => import('./features/about/about.routes').then((m) => m.aboutRoutes),
  },
  {
    path: '**',
    redirectTo: 'play',
  },
];
