import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, timeout } from 'rxjs';
import {
  AuthResponse,
  Comment,
  Forum,
  Post,
  PostService,
  Subforum,
  UserSummary,
} from '../services/post';

type ViewMode = 'feed' | 'explore' | 'compose';
type SortMode = 'new' | 'top' | 'discussion';
type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-post',
  imports: [CommonModule, FormsModule],
  templateUrl: './post.html',
  styleUrl: './post.scss',
})
export class PostComponent implements OnInit {
  posts: Post[] = [];
  forums: Forum[] = [];
  subforums: Subforum[] = [];
  commentsByPost: Partial<Record<string, Comment[]>> = {};
  commentsLoading: Partial<Record<string, boolean>> = {};
  commentDrafts: Record<string, string> = {};

  activeView: ViewMode = 'feed';
  sortMode: SortMode = 'new';
  authMode: AuthMode = 'login';
  selectedForumId = 'all';
  selectedSubforumId = 'all';
  expandedPostId = '';
  searchTerm = '';

  loading = true;
  postSaving = false;
  communitySaving = false;
  authLoading = false;
  errorMessage = '';
  actionMessage = '';
  authMessage = '';

  token = '';
  currentUser: UserSummary | null = null;

  authForm = {
    username: '',
    email: '',
    password: '',
  };

  postForm = {
    title: '',
    content: '',
    subforumId: '',
  };

  communityForm = {
    name: '',
    slug: '',
    description: '',
    forumId: '',
  };

  private readonly tokenKey = 'rednova_token';
  private readonly userKey = 'rednova_user';
  private communitySlugTouched = false;

  constructor(
    private postService: PostService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (this.isBrowser) {
      this.restoreSession();
    }

    this.loadInitialData();
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token && this.currentUser);
  }

  get visiblePosts(): Post[] {
    const query = this.normalize(this.searchTerm);

    return [...this.posts]
      .filter((post) => {
        const forumMatches = this.selectedForumId === 'all' || this.getPostForumId(post) === this.selectedForumId;
        const subforumMatches =
          this.selectedSubforumId === 'all' || this.getPostSubforumId(post) === this.selectedSubforumId;

        if (!forumMatches || !subforumMatches) return false;
        if (!query) return true;

        return [
          post.title,
          post.content,
          this.getAuthorName(post.author),
          this.getForumName(post.forum),
          this.getSubforumName(post.subforum),
        ].some((value) => this.normalize(value).includes(query));
      })
      .sort((a, b) => this.comparePosts(a, b));
  }

  get visibleSubforums(): Subforum[] {
    if (this.selectedForumId === 'all') return this.subforums;
    return this.subforums.filter((subforum) => this.getSubforumForumId(subforum) === this.selectedForumId);
  }

  get selectedForumName(): string {
    if (this.selectedForumId === 'all') return 'Todos los foros';
    return this.forums.find((forum) => forum._id === this.selectedForumId)?.name ?? 'Foro seleccionado';
  }

  get selectedSubforumName(): string {
    if (this.selectedSubforumId === 'all') return 'Todas las comunidades';
    return this.subforums.find((subforum) => subforum._id === this.selectedSubforumId)?.name ?? 'Comunidad';
  }

  get canCreatePost(): boolean {
    return this.isAuthenticated && this.subforums.length > 0;
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      posts: this.postService.getPosts(),
      forums: this.postService.getForums(),
      subforums: this.postService.getSubforums(),
    })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading = false;
          this.refreshView();
        })
      )
      .subscribe({
        next: ({ posts, forums, subforums }) => {
          this.posts = posts;
          this.forums = forums;
          this.subforums = subforums;
          this.setDefaultSelections();
          this.refreshView();
        },
        error: (error: unknown) => {
          this.errorMessage = this.messageFromError(error, 'No fue posible cargar RedNova.');
          this.refreshView();
        },
      });
  }

  refreshPosts(): void {
    this.postService
      .getPosts()
      .pipe(timeout(12000))
      .subscribe({
        next: (posts) => {
          this.posts = posts;
          this.refreshView();
        },
        error: (error: unknown) => {
          this.actionMessage = this.messageFromError(error, 'No fue posible actualizar el feed.');
          this.refreshView();
        },
      });
  }

  submitAuth(): void {
    this.authMessage = '';

    if (!this.authForm.email || !this.authForm.password) {
      this.authMessage = 'Email y password son requeridos.';
      return;
    }

    if (this.authMode === 'register' && !this.authForm.username) {
      this.authMessage = 'El nombre de usuario es requerido.';
      return;
    }

    this.authLoading = true;
    const request =
      this.authMode === 'login'
        ? this.postService.login(this.authForm.email, this.authForm.password)
        : this.postService.register(this.authForm.username, this.authForm.email, this.authForm.password);

    request
      .pipe(
        timeout(12000),
        finalize(() => {
          this.authLoading = false;
          this.refreshView();
        })
      )
      .subscribe({
        next: (response) => {
          this.setSession(response);
          this.authMessage = 'Sesion lista.';
          this.actionMessage = `Hola, ${response.user.username}.`;
          this.authForm.password = '';
        },
        error: (error: unknown) => {
          this.authMessage = this.messageFromError(error, 'No se pudo iniciar sesion.');
        },
      });
  }

  logout(): void {
    this.token = '';
    this.currentUser = null;
    this.actionMessage = 'Sesion cerrada.';

    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  submitPost(): void {
    this.actionMessage = '';

    if (!this.isAuthenticated) {
      this.actionMessage = 'Inicia sesion para publicar.';
      return;
    }

    if (!this.postForm.title.trim() || !this.postForm.content.trim() || !this.postForm.subforumId) {
      this.actionMessage = 'Completa titulo, contenido y comunidad.';
      return;
    }

    const subforum = this.subforums.find((item) => item._id === this.postForm.subforumId);
    const forumId = subforum ? this.getSubforumForumId(subforum) : '';

    if (!subforum || !forumId) {
      this.actionMessage = 'Selecciona una comunidad valida.';
      return;
    }

    this.postSaving = true;
    this.postService
      .createPost(
        {
          title: this.postForm.title.trim(),
          content: this.postForm.content.trim(),
          subforum: subforum._id,
          forum: forumId,
        },
        this.token
      )
      .pipe(
        timeout(12000),
        finalize(() => {
          this.postSaving = false;
          this.refreshView();
        })
      )
      .subscribe({
        next: (response) => {
          this.posts = response.newPost ? [response.newPost, ...this.posts] : this.posts;
          this.postForm.title = '';
          this.postForm.content = '';
          this.activeView = 'feed';
          this.actionMessage = 'Publicacion creada.';
        },
        error: (error: unknown) => {
          this.actionMessage = this.messageFromError(error, 'No se pudo crear la publicacion.');
        },
      });
  }

  submitCommunity(): void {
    this.actionMessage = '';

    if (!this.isAuthenticated) {
      this.actionMessage = 'Inicia sesion para crear una comunidad.';
      return;
    }

    if (!this.forums.length) {
      this.actionMessage = 'Primero debe existir una categoria.';
      return;
    }

    const name = this.communityForm.name.trim();
    const slug = (this.communityForm.slug || this.slugify(name)).trim();
    const forumId = this.communityForm.forumId || this.selectedForumId !== 'all'
      ? this.communityForm.forumId || this.selectedForumId
      : this.forums[0]._id;

    if (!name || !slug || !forumId) {
      this.actionMessage = 'Completa nombre, slug y categoria.';
      return;
    }

    this.communitySaving = true;
    this.postService
      .createCommunity(
        {
          name,
          slug,
          description: this.communityForm.description.trim(),
          forum: forumId,
        },
        this.token
      )
      .pipe(
        timeout(12000),
        finalize(() => {
          this.communitySaving = false;
          this.refreshView();
        })
      )
      .subscribe({
        next: (response) => {
          this.subforums = [response.subforum, ...this.subforums];
          this.communityForm = { name: '', slug: '', description: '', forumId: forumId };
          this.communitySlugTouched = false;
          this.selectedForumId = forumId;
          this.selectedSubforumId = response.subforum._id;
          this.postForm.subforumId = response.subforum._id;
          this.activeView = 'compose';
          this.actionMessage = 'Comunidad creada. Ya puedes publicar ahi.';
        },
        error: (error: unknown) => {
          this.actionMessage = this.messageFromError(error, 'No se pudo crear la comunidad.');
        },
      });
  }

  vote(post: Post, voteType: 'up' | 'down'): void {
    if (!this.isAuthenticated) {
      this.actionMessage = 'Inicia sesion para votar.';
      return;
    }

    this.postService
      .votePost(post._id, voteType, this.token)
      .pipe(timeout(12000))
      .subscribe({
        next: (response) => {
          post.score = response.score;
          this.refreshView();
        },
        error: (error: unknown) => {
          this.actionMessage = this.messageFromError(error, 'No se pudo registrar el voto.');
          this.refreshView();
        },
      });
  }

  togglePost(post: Post): void {
    if (this.expandedPostId === post._id) {
      this.expandedPostId = '';
      return;
    }

    this.expandedPostId = post._id;
    if (!this.commentsByPost[post._id]) {
      this.loadComments(post._id);
    }
  }

  loadComments(postId: string): void {
    this.commentsLoading[postId] = true;
    this.postService
      .getComments(postId)
      .pipe(
        timeout(12000),
        finalize(() => {
          this.commentsLoading[postId] = false;
          this.refreshView();
        })
      )
      .subscribe({
        next: (comments) => {
          this.commentsByPost[postId] = comments;
        },
        error: (error: unknown) => {
          this.actionMessage = this.messageFromError(error, 'No se pudieron cargar los comentarios.');
        },
      });
  }

  submitComment(post: Post): void {
    const draft = (this.commentDrafts[post._id] ?? '').trim();

    if (!this.isAuthenticated) {
      this.actionMessage = 'Inicia sesion para comentar.';
      return;
    }

    if (!draft) {
      this.actionMessage = 'Escribe un comentario primero.';
      return;
    }

    this.postService
      .createComment(post._id, draft, this.token)
      .pipe(timeout(12000))
      .subscribe({
        next: () => {
          this.commentDrafts[post._id] = '';
          this.loadComments(post._id);
          post.comments = [...(post.comments ?? []), 'new'];
          this.refreshView();
        },
        error: (error: unknown) => {
          this.actionMessage = this.messageFromError(error, 'No se pudo publicar el comentario.');
          this.refreshView();
        },
      });
  }

  selectForum(forumId: string): void {
    this.selectedForumId = forumId;
    this.selectedSubforumId = 'all';
    if (forumId !== 'all') {
      this.communityForm.forumId = forumId;
    }
  }

  selectSubforum(subforumId: string): void {
    this.selectedSubforumId = subforumId;

    if (subforumId !== 'all') {
      const subforum = this.subforums.find((item) => item._id === subforumId);
      if (subforum) {
        this.selectedForumId = this.getSubforumForumId(subforum) || this.selectedForumId;
        this.postForm.subforumId = subforum._id;
      }
    }
  }

  clearFilters(): void {
    this.selectedForumId = 'all';
    this.selectedSubforumId = 'all';
    this.searchTerm = '';
  }

  updateCommunitySlug(name: string): void {
    if (!this.communitySlugTouched) {
      this.communityForm.slug = this.slugify(name);
    }
  }

  markCommunitySlugTouched(): void {
    this.communitySlugTouched = true;
  }

  getForumName(value: string | Forum | undefined): string {
    if (!value) return 'Sin categoria';
    if (typeof value !== 'string') return value.name;
    return this.forums.find((forum) => forum._id === value)?.name ?? 'Sin categoria';
  }

  getSubforumName(value: string | Subforum | undefined): string {
    if (!value) return 'Sin comunidad';
    if (typeof value !== 'string') return value.name;
    return this.subforums.find((subforum) => subforum._id === value)?.name ?? 'Sin comunidad';
  }

  getAuthorName(value: string | UserSummary | undefined): string {
    if (!value) return 'usuario';
    if (typeof value !== 'string') return value.username;
    return 'usuario';
  }

  getPostForumId(post: Post): string {
    if (!post.forum) return '';
    return typeof post.forum === 'string' ? post.forum : post.forum._id;
  }

  getPostSubforumId(post: Post): string {
    if (!post.subforum) return '';
    return typeof post.subforum === 'string' ? post.subforum : post.subforum._id;
  }

  getSubforumForumId(subforum: Subforum): string {
    return typeof subforum.forum === 'string' ? subforum.forum : subforum.forum._id;
  }

  postCommentCount(post: Post): number {
    return this.commentsByPost[post._id]?.length ?? post.comments?.length ?? 0;
  }

  forumSubforumCount(forum: Forum): number {
    return this.subforums.filter((subforum) => this.getSubforumForumId(subforum) === forum._id).length;
  }

  postScore(post: Post): number {
    return post.score ?? 0;
  }

  trackById(_index: number, item: { _id: string }): string {
    return item._id;
  }

  private setDefaultSelections(): void {
    if (!this.postForm.subforumId && this.subforums.length) {
      this.postForm.subforumId = this.subforums[0]._id;
    }

    if (!this.communityForm.forumId && this.forums.length) {
      this.communityForm.forumId = this.forums[0]._id;
    }
  }

  private setSession(response: AuthResponse): void {
    this.token = response.token;
    this.currentUser = response.user;

    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
    }
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.tokenKey);
    const user = localStorage.getItem(this.userKey);

    if (!token || !user) return;

    try {
      this.token = token;
      this.currentUser = JSON.parse(user) as UserSummary;
    } catch {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  private comparePosts(a: Post, b: Post): number {
    if (this.sortMode === 'top') {
      return this.postScore(b) - this.postScore(a);
    }

    if (this.sortMode === 'discussion') {
      return this.postCommentCount(b) - this.postCommentCount(a);
    }

    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  }

  private normalize(value: string | undefined): string {
    return (value ?? '').toLowerCase().trim();
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  private messageFromError(error: unknown, fallback: string): string {
    const httpError = error as { error?: { message?: string; error?: string }; message?: string };
    return httpError.error?.message ?? httpError.error?.error ?? httpError.message ?? fallback;
  }

  private refreshView(): void {
    this.cdr.detectChanges();
  }
}
