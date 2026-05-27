import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from './rednovaweb/src/auth.service';

@Component({
  selector: 'rn-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-left">
        <a routerLink="/" class="logo">
          <span class="icon">🚀</span> RedNova
        </a>
      </div>
      
      <div class="nav-center">
        <div class="search-container">
          <input type="text" placeholder="Search RedNova" class="search-input">
        </div>
      </div>

      <div class="nav-right">
        @if (auth.currentUser()) {
          <div class="user-info">
            <span class="username">u/{{ auth.currentUser()?.username }}</span>
            <button (click)="auth.logout()" class="btn-text">Logout</button>
          </div>
        } @else {
          <a routerLink="/auth/login" class="btn btn-outline">Log In</a>
          <a routerLink="/auth/register" class="btn btn-primary">Sign Up</a>
        }
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .navbar {
      height: 48px;
      background: var(--rn-header-bg);
      border-bottom: 1px solid var(--rn-border);
      display: flex;
      align-items: center;
      padding: 0 20px;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .logo { 
      color: var(--rn-primary); 
      font-weight: 800; 
      font-size: 18px; 
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-center { flex: 1; display: flex; justify-content: center; max-width: 600px; margin: 0 auto; }
    .search-input { 
      background: var(--rn-hover); 
      border: 1px solid var(--rn-border); 
      padding: 6px 16px; 
      border-radius: 20px; 
      width: 100%;
      outline: none;
    }
    .search-input:focus { background: white; border-color: var(--rn-blue); }
    .nav-right { display: flex; gap: 12px; align-items: center; }
    .username { font-weight: 600; font-size: 14px; }
    .btn-text { background: none; border: none; color: var(--rn-text-sub); cursor: pointer; }
  `]
})
export class Navbar {
  protected readonly auth = inject(AuthService);
}