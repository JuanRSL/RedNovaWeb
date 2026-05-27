import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../../../post.service';
import { SubforumService } from '../../../../subforum.service';
import { Subforum } from '../../../../post.model';

@Component({
  selector: 'rn-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss']
})
export class PostFormComponent implements OnInit {
  error = signal('');
  isSubmitting = signal(false);
  subforums = signal<Subforum[]>([]);

  form = new FormGroup({
    title: new FormControl('', Validators.required),
    content: new FormControl('', Validators.required),
    subforum: new FormControl('', Validators.required)
  });

  constructor(
    private postService: PostService,
    private subforumService: SubforumService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSubforums();
  }

  loadSubforums() {
    this.subforumService.getSubforums().subscribe({
      next: (subforums) => this.subforums.set(subforums),
      error: (err) => this.error.set(err?.error?.message || 'Unable to load subforums.')
    });
  }

  submit() {
    if (this.form.invalid) {
      this.error.set('Please complete all post fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    this.postService.createPost(this.form.value as { title: string; content: string; subforum: string }).subscribe({
      next: () => this.router.navigate(['/posts']),
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to create post.');
        this.isSubmitting.set(false);
      }
    });
  }
}
