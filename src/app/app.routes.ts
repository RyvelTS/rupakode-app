import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { HomePage } from './views/home-page/home-page';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        component: HomePage,
      },
      {
        path: 'git-message',
        loadComponent: () => import('./features/conventional-commit-message/conventional-commit-message').then(m => m.ConventionalCommitMessage),
      },
      {
        path: 'color-palette',
        loadComponent: () => import('./features/color-palette/color-palette').then(m => m.ColorPalette),
      },
    ]
  },
];
