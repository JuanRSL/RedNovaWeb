import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'auth/login', renderMode: RenderMode.Server },
  { path: 'auth/register', renderMode: RenderMode.Server },
  { path: 'posts', renderMode: RenderMode.Server },
  { path: 'posts/new', renderMode: RenderMode.Server },
  { path: 'posts/:id', renderMode: RenderMode.Server },
  { path: 'profile', renderMode: RenderMode.Server }
];
