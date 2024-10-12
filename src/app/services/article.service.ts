import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ArticleList } from '../interfaces/article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private articlesUrl = 'http://sanger.dia.fi.upm.es/pui-rest-news/articles';
  private articleDetailUrl = 'http://sanger.dia.fi.upm.es/pui-rest-news/article'; // URL for fetching article details

  constructor(private http: HttpClient) { }

  getArticles(): Observable<ArticleList[]> {
    return this.http.get<ArticleList[]>(this.articlesUrl).pipe(
      tap(_ => console.log('Fetched article list')),
      catchError(this.handleError<ArticleList[]>('getArticles', []))
    );
  }

  getArticleById(id: string): Observable<ArticleList> {
    const url = `${this.articleDetailUrl}/${id}`;
    return this.http.get<ArticleList>(url).pipe(
      tap(_ => console.log(`Fetched article details for id=${id}`)),
      catchError(this.handleError<ArticleList>('getArticleById'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}