import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../services/article.service';
import { Article } from '../interfaces/article';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.css'],
  imports: [CommonModule, CardModule, ButtonModule, DividerModule]
})
export class ArticleDetailComponent implements OnInit {
  article!: Article | null;
  articleId!: string;
  isLoading: boolean = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private articleService: ArticleService, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.articleId = params.get('id')!;
      this.getArticleById(this.articleId);
    });
  }

  getArticleById(id: string): void {
    this.articleService.getArticleById(id).subscribe(
      (data: Article) => {
        this.article = data;
        console.log(data)
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching article:', error);
        this.isLoading = false;
        this.error = 'Failed to load article';
      }
    );
  }

  goBack(): void {
    this.router.navigate(['..']);
  }
}