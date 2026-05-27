import { Component, OnInit } from '@angular/core';
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
  // Inyección del servicio PostService en el constructor
  constructor(private postService: PostService) { }
// Método que se ejecuta al inicializar el componente
  ngOnInit(): void {
    this.loadPosts();
  };
  // Método para cargar los posts desde el servicio
  loadPosts() {
    this.postService.getPosts().subscribe((data: any) => {
      this.posts = data;
    });
  }
  // Método para eliminar un post por su ID
  deletePost(id: string):Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
