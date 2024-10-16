import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { NewsService } from './services/news.service';
import { ArticleList } from './interfaces/article';
import { MenubarModule } from "primeng/menubar";
import { AvatarModule } from "primeng/avatar";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { CommonModule } from '@angular/common';
import { LoginService } from './services/login.service';
import { OverlayPanelModule, OverlayPanel } from 'primeng/overlaypanel';
import { User } from './interfaces/user';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    MenubarModule,
    AvatarModule,
    InputTextModule,
    OverlayPanelModule,
    FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  items: any[] = [];
  activeItem: string = '';
  isLoggedIn: boolean = false;
  isLoginPage: boolean = false;
  user: User | null = null;
  allArticles: ArticleList[] = [];
  filteredArticles: ArticleList[] = [];

  constructor(
    private newsService: NewsService,
    private router: Router,
    private loginService: LoginService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.populateMenuItems();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = this.router.url;
        const category = this.activatedRoute.firstChild?.snapshot.params['category'] 
                        || this.activatedRoute.snapshot.params['category'];
        this.activeItem = category ? `/${category.toLowerCase()}` : '/';
        this.isLoginPage = url === '/login';
      }
    });

    this.isLoggedIn = this.loginService.isLogged();

    this.loginService.loginStatus$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  populateMenuItems(): void {
    this.newsService.getArticles().subscribe((data: ArticleList[]) => {
      const categories = this.getCategories(data);
      const iconList = ['pi-map-marker', 'pi-bitcoin', 'pi-bolt', 'pi-dollar', 'pi-globe'];
      
      this.items = [
        { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: '/', command: () => this.goHome() },
        ...categories.map((category, index) => ({
          label: category,
          icon: `pi ${iconList[index]}`,
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

  login(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/']);
  }

  onAvatarClick(event: Event, overlayPanel: OverlayPanel): void {
    overlayPanel.toggle(event);
    this.user = this.loginService.getUser();
  }
}