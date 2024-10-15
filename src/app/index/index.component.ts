import { Component, OnInit } from '@angular/core';
import { Article } from '../interfaces/article';  
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NewsService } from '../services/news.service'; 
import { LoginService } from '../services/login.service'; 
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';


@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    FormsModule,
    ButtonModule,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    OverlayPanelModule,
    ConfirmDialogModule
  ],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class IndexComponent implements OnInit {
  isLoggedIn: boolean = false;
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  featuredArticle!: Article;
  title: string = "All Articles";
  isCategoryPage: boolean = false;
  searchTerm: string = ''; // 新增的搜索字段

  items: any[] = [
    { label: 'Home', icon: 'pi pi-fw pi-home', command: () => this.showAllArticles() }
  ];

  constructor(
    private newsService: NewsService, 
    private loginService: LoginService, 
    private router: Router, 
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.loginService.isLogged();
    this.getArticles();
    this.route.paramMap.subscribe(params => {
      const category = params.get('category');
      if (category) {
        this.filterByCategory(category);
      } else {
        this.showAllArticles();
      }
    });
  }

  getArticles(): void {
    this.newsService.getArticles().subscribe((data: Article[]) => {
      this.articles = data;
      this.filteredArticles = data;
      if (this.articles.length > 0) {
        this.featuredArticle = this.articles[0];
      }
      this.populateMenuItems();
    });
  }

  populateMenuItems(): void {
    const categories = this.getCategories();
    this.items = [{ label: 'Home', icon: 'pi pi-fw pi-home', command: () => this.showAllArticles() }];
    categories.forEach(category => {
      this.items.push({
        label: category,
        icon: 'pi pi-fw pi-tag',
        command: () => this.filterByCategory(category)
      });
    });
  }

  getCategories(): string[] {
    const categoriesSet = new Set(this.articles.map(article => article.category));
    return Array.from(categoriesSet);
  }

  showAllArticles(): void {
    this.filteredArticles = this.articles;
    this.title = "All Articles";
    this.isCategoryPage = false;
    this.router.navigate(['/']);
  }

  filterByCategory(category: string): void {
    this.filteredArticles = this.articles.filter(article => article.category.toLowerCase() === category.toLowerCase());
    this.title = category;
    this.isCategoryPage = true;
  }

  onOptionsClick(event: Event, overlayPanel: any): void {
    overlayPanel.toggle(event);
  }

  editArticle(articleId: string): void {
    this.router.navigate(['/edit-article', articleId]);
  }

  confirmDelete(articleId: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this article?',
      accept: () => {
        this.deleteArticle(articleId);
      }
    });
  }

  deleteArticle(articleId: string): void {
    this.newsService.deleteArticle(articleId).subscribe({
      next: () => {
        this.filteredArticles = this.filteredArticles.filter(article => article.id !== articleId);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Article deleted successfully' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete the article' });
      }
    });
  }

  navigateToArticle(articleId: string): void {
    const category = this.route.snapshot.paramMap.get('category') || 'national';
    this.router.navigate([`${category}/article`, articleId]);
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.filteredArticles = this.articles.filter(article =>
        article.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        article.abstract.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        article.subtitle.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredArticles = this.articles;
    }
  }
}