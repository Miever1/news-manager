import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ArticleService } from './services/article.service';
import { ArticleList } from './interfaces/article';
import { MenubarModule } from "primeng/menubar";
import { AvatarModule } from "primeng/avatar";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MenubarModule, AvatarModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  items: any[] = [];
  activeItem: string = ''; // Variable to track the active item

  constructor(private articleService: ArticleService, private router: Router) {}

  ngOnInit(): void {
    this.populateMenuItems();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activeItem = this.router.url; // Update active item based on current URL
      }
    });
  }

  populateMenuItems(): void {
    this.articleService.getArticles().subscribe((data: ArticleList[]) => {
      const categories = this.getCategories(data);
      this.items = [
        { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: '/', command: () => this.goHome() },
        ...categories.map(category => ({
          label: category,
          icon: 'pi pi-fw pi-tag',
          routerLink: `/${category.toLowerCase()}`,
          command: () => this.filterByCategory(category)
        }))
      ];
    });
  }

  getCategories(articles: ArticleList[]): string[] {
    const categoriesSet = new Set(articles.map(article => article.category));
    return Array.from(categoriesSet);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  filterByCategory(category: string): void {
    this.router.navigate([`/${category.toLowerCase()}`]);
  }
}