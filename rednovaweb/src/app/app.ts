import { Component, signal } from '@angular/core';
import { PostComponent } from "./post/post.component";
import { LoginComponent } from "./login/login.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
  imports: [PostComponent, LoginComponent]
})
export class App {
  protected readonly title = signal('rednovaweb');
}
