import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PostService } from '../services/post';

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
  }

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

  // 🟢 CORREGIDO: Ahora le pide al servicio que elimine el post y luego actualiza la lista
  deletePost(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este post?')) {
      this.postService.deletePost(id).subscribe(() => {
        // Filtra el post eliminado de la lista para que desaparezca visualmente de inmediato
        this.posts = this.posts.filter(post => post.id !== id); 
      }, (error) => {
        this.errorMessage = error?.error?.message || 'No se pudo eliminar el post';
      });
    }
  }
}
