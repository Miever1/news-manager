import { Component, OnInit, HostListener } from '@angular/core';
import { lastValueFrom } from 'rxjs';
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
import { ElectronService } from './services/electron.service';
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
  isElectronApp: boolean = false;
  isMaximized: boolean = false;
  isMenuFixed: boolean = false;

  constructor(
    private newsService: NewsService,
    private router: Router,
    private loginService: LoginService,
    private activatedRoute: ActivatedRoute,
    private electronService: ElectronService
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    this.isMenuFixed = scrollPosition > 80;
  }

  ngOnInit(): void {
    this.loginService.loginStatus$.subscribe((status) => {
      this.isLoggedIn = status;
    });
  
    this.isElectronApp = this.electronService.isElectron();
  
    this.populateMenuItems().then(() => {
      if (this.isElectronApp && window.electronAPI) {
        setTimeout(() => {
          window.electronAPI.windowReady();
        }, 2000);
      }
    });
  
    if (this.isElectronApp) {
      window.electronAPI.ipcRenderer.on('window-state-changed', (_event: any, data: { isMaximized: boolean }) => {
        this.isMaximized = data.isMaximized;
      });
    }
  
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = this.router.url;
        const category =
          this.activatedRoute.firstChild?.snapshot.params['category'] ||
          this.activatedRoute.snapshot.params['category'];
        this.activeItem = category ? `/${category.toLowerCase()}` : '/';
        this.isLoginPage = url === '/login';
      }
    });
  
    this.isLoggedIn = this.loginService.isLogged();
  }

  async populateMenuItems(): Promise<void> {
    const data = await lastValueFrom(this.newsService.getArticles());
    const categories = this.getCategories(data || []);
    const iconList = ['pi-map-marker', 'pi-bitcoin', 'pi-bolt', 'pi-dollar', 'pi-globe'];
  
    this.items = [
      { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: '/', command: () => this.goHome() },
      ...categories.map((category, index) => ({
        label: category,
        icon: `pi ${iconList[index]}`,
        routerLink: `/${category.toLowerCase()}`,
        command: () => this.filterByCategory(category),
      })),
    ];
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
    this.goHome();
  }

  onAvatarClick(event: Event, overlayPanel: OverlayPanel): void {
    overlayPanel.toggle(event);
    this.loginService.getUser().then((user) => {
      this.user = user;
    });
  }
}