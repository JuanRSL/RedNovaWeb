import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PostService } from '../services/post';
import { Observable } from 'rxjs';

// Componente para mostrar y gestionar posts
@Component({
  selector: 'app-post',
  imports: [],
  templateUrl: './post.html',
  styleUrl: './post.scss',
})
// Clase del componente Post
export class PostComponent implements OnInit {
  // Array para almacenar los posts obtenidos del servicio
  posts: any[] = [];
  loading = false;
  errorMessage = '';
  // Inyección del servicio PostService en el constructor
  constructor(
    private postService: PostService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }
// Método que se ejecuta al inicializar el componente
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPosts();
    }
  };
  // Método para cargar los posts desde el servicio
  loadPosts() {
    this.loading = true;
    this.errorMessage = '';
    this.postService.getPosts().subscribe((data: any) => {
      this.posts = data;
      this.loading = false;
    }, (error) => {
      this.loading = false;
      this.errorMessage = error?.error?.message || 'No fue posible conectar con el backend';
    });
  }
  // Método para eliminar un post por su ID
  deletePost(id: string):Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
