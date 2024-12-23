import { provideRouter, Routes, withHashLocation } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { LoginComponent } from './login/login.component';
import { CreateArticleComponent } from './create-article/create-article.component';
import { ArticleDetailComponent } from './article-detail/article-detail.component';

export const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'login', component: LoginComponent },
  { path: 'create-article', component: CreateArticleComponent },
  { path: 'edit-article/:id', component: CreateArticleComponent },
  { path: ':category/article/:id', component: ArticleDetailComponent },
  { path: ':category', component: IndexComponent },
  { path: '**', redirectTo: '' }
];

export const appRouterProviders = [
  provideRouter(routes, withHashLocation())
];