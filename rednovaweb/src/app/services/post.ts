import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = '/api/posts';
  
  constructor(private http: HttpClient) {}
  //obtener posts
  getPosts(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
  //crear post
  createPost(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
  //eliminar post
  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
