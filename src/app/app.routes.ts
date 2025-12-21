import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'play'
  },
  {
    path: 'play',
    loadChildren: () =>
      import('./features/play/play.routes').then((m) => m.playRoutes)
  },
  {
    path: 'recordings',
    loadChildren: () =>
      import('./features/recordings/recordings.routes').then((m) => m.recordingsRoutes)
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.routes').then((m) => m.settingsRoutes)
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./features/about/about.routes').then((m) => m.aboutRoutes)
  },
  {
    path: '**',
    redirectTo: 'play'
  }
];
