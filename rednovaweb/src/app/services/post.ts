import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSummary {
  id?: string;
  _id?: string;
  username: string;
  email?: string;
  roles?: string[];
}

export interface Forum {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate?: boolean;
  createdAt?: string;
  subforums?: Array<string | Subforum>;
}

export interface Subforum {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  forum: string | Forum;
  followers?: string[];
  createdAt?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author?: string | UserSummary;
  forum?: string | Forum;
  subforum?: string | Subforum;
  createdAt?: string;
  comments?: string[];
  upvotes?: string[];
  downvotes?: string[];
  score?: number;
}

export interface Comment {
  _id: string;
  content: string;
  author?: string | UserSummary;
  post: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserSummary;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  subforum: string;
  forum?: string;
}

export interface CreateCommunityPayload {
  name: string;
  slug: string;
  description?: string;
  forum: string;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly apiBase = 'http://localhost:3000/api';
  private readonly postsUrl = `${this.apiBase}/posts`;
  private readonly forumsUrl = `${this.apiBase}/forums`;
  private readonly subforumsUrl = `${this.apiBase}/subforums`;
  private readonly commentsUrl = `${this.apiBase}/comentarios`;
  private readonly usersUrl = `${this.apiBase}/usuarios`;

  constructor(private http: HttpClient) {}

  getPosts(options?: { search?: string; forumId?: string; subforumId?: string }): Observable<Post[]> {
    let params = new HttpParams();
    if (options?.search) params = params.set('search', options.search);
    if (options?.forumId) params = params.set('forumId', options.forumId);
    if (options?.subforumId) params = params.set('subforumId', options.subforumId);

    return this.http.get<Post[]>(this.postsUrl, { params });
  }

  getForums(): Observable<Forum[]> {
    return this.http.get<Forum[]>(this.forumsUrl);
  }

  getSubforums(forumId?: string): Observable<Subforum[]> {
    const options = forumId ? { params: new HttpParams().set('forumId', forumId) } : {};
    return this.http.get<Subforum[]>(this.subforumsUrl, options);
  }

  createPost(payload: CreatePostPayload, token: string): Observable<{ message: string; newPost: Post }> {
    return this.http.post<{ message: string; newPost: Post }>(
      this.postsUrl,
      payload,
      this.authOptions(token)
    );
  }

  votePost(postId: string, voteType: 'up' | 'down', token: string): Observable<{ message: string; score: number }> {
    return this.http.post<{ message: string; score: number }>(
      `${this.postsUrl}/vote`,
      { postId, voteType },
      this.authOptions(token)
    );
  }

  deletePost(id: string, token: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.postsUrl}/delete/${id}`, this.authOptions(token));
  }

  getComments(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.commentsUrl}/post/${postId}`);
  }

  createComment(postId: string, content: string, token: string): Observable<{ message: string; newComment: Comment }> {
    return this.http.post<{ message: string; newComment: Comment }>(
      this.commentsUrl,
      { postId, content },
      this.authOptions(token)
    );
  }

  createCommunity(payload: CreateCommunityPayload, token: string): Observable<{ message: string; subforum: Subforum }> {
    return this.http.post<{ message: string; subforum: Subforum }>(
      this.subforumsUrl,
      payload,
      this.authOptions(token)
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.usersUrl}/login`, { email, password });
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.usersUrl}/register`, { username, email, password });
  }

  private authOptions(token: string): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }
}
