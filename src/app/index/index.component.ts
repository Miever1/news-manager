import { Component, OnInit } from '@angular/core';
import { NewsService } from '../services/news.service';  
import { Article } from '../interfaces/article';  
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  featuredArticle!: Article;
  title: string = "All Articles";
  isCategoryPage: boolean = false;

  items: any[] = [
    { label: 'Home', icon: 'pi pi-fw pi-home', command: () => this.showAllArticles() }
  ];

  constructor(private newsService: NewsService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
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

      console.log(data[0])
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

  navigateToArticle(articleId: string): void {
    this.router.navigate(['/article', articleId]);
  }
}