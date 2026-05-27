import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'posts',
        children: [
          { path: '', loadComponent: () => import('./features/posts/post-list/post-list.component').then(m => m.PostListComponent) },
          { path: 'new', loadComponent: () => import('./features/posts/post-form/post-form.component').then(m => m.PostFormComponent) },
          { path: ':id', loadComponent: () => import('./features/posts/post-detail/post-detail.component').then(m => m.PostDetailComponent) }
        ]
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      { path: '', redirectTo: 'posts', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'posts' }
];
