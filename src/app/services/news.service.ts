import { Injectable } from '@angular/core';
import { Article } from '../interfaces/article';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private articlesUrl = `${environment.apiBaseUrl}/articles`;
  private articleUrl = `${environment.apiBaseUrl}/article`;

  private APIKEY: string | null;
  private APIKEY_ANON = 'ANON08'; 

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'PUIRESTAUTH apikey=' + this.APIKEY_ANON 
    })
  };

  constructor(private http: HttpClient) {
    this.APIKEY = null;
  }

  setUserApiKey(apikey: string | undefined): void {
    if (apikey) {
      this.APIKEY = apikey; 
      this.httpOptions.headers = this.httpOptions.headers.set('Authorization', 'PUIRESTAUTH apikey=' + this.APIKEY);
    }
  }

  setAnonymousApiKey(): void {
    this.setUserApiKey(this.APIKEY_ANON); 
  }

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.articlesUrl, this.httpOptions).pipe(
      tap(_ => console.log('Fetched article list')),
      catchError(this.handleError<Article[]>('getArticles', []))
    );
  }
  
  getArticle(id: string): Observable<Article> {
    const url = `${this.articleUrl}/${id}`;
    return this.http.get<Article>(url, this.httpOptions).pipe(
      tap(_ => console.log(`Fetched article details for id=${id}`)),
      catchError(this.handleError<Article>('getArticle'))
    );
  }

  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(this.articleUrl, article, this.httpOptions).pipe(
      tap(_ => console.log('Created article')),
      catchError(this.handleError<Article>('createArticle'))
    );
  }

  updateArticle(article: Article): Observable<Article> {
    const url = `${this.articleUrl}`;
    return this.http.post<Article>(url, article, this.httpOptions).pipe(
      tap(_ => console.log(`Updated article id=${article.id}`)),
      catchError(this.handleError<Article>('updateArticle'))
    );
  }

  deleteArticle(article: Article | string): Observable<void> {
    const id = typeof article === 'string' ? article : article.id;
    const url = `${this.articleUrl}/${id}`;
    return this.http.delete<void>(url, this.httpOptions).pipe(
      tap(_ => console.log(`Deleted article id=${id}`)),
      catchError(this.handleError<void>('deleteArticle'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      throw error;
    };
  }
}