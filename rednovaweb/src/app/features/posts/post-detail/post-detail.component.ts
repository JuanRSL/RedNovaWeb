import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostService } from '../../../../post.service';
import { Post } from '../../../../post.model';

@Component({
  selector: 'rn-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);
  error = signal('');
  isLoading = signal(true);

  constructor(private route: ActivatedRoute, private postService: PostService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Post not found');
      this.isLoading.set(false);
      return;
    }

    this.postService.getPostById(id).subscribe({
      next: (post) => {
        this.post.set(post);
        if (!post) {
          this.error.set('Post not found');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to load post.');
        this.isLoading.set(false);
      }
    });
  }

  vote(type: 'up' | 'down') {
    const currentPost = this.post();
    if (!currentPost) {
      return;
    }

    const id = currentPost._id || currentPost.id;
    if (!id) {
      return;
    }

    this.postService.votePost(id, type).subscribe({
      next: ({ score }) => {
        this.post.set({ ...currentPost, score });
      },
      error: (err) => this.error.set(err?.error?.message || 'Unable to cast vote.')
    });
  }
}
