import { Injectable } from '@angular/core';
import { Article } from '../interfaces/article';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private articlesUrl = 'http://sanger.dia.fi.upm.es/pui-rest-news/articles';
  private articleDetailUrl = 'http://sanger.dia.fi.upm.es/pui-rest-news/article';

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
      console.log('API key successfully changed to ' + this.APIKEY);
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

  getArticleById(id: string): Observable<Article> {
    const url = `${this.articleDetailUrl}/${id}`;
    return this.http.get<Article>(url, this.httpOptions).pipe(
      tap(_ => console.log(`Fetched article details for id=${id}`)),
      catchError(this.handleError<Article>('getArticleById'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}