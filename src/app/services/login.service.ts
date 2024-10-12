import { Injectable } from '@angular/core';
import { User } from '../interfaces/user'; 
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private user: User | null = null;
  private loginUrl = 'http://sanger.dia.fi.upm.es/pui-rest-news/login';
  private loginStatusSubject = new BehaviorSubject<boolean>(false);

  private httpOptions = {
    headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
  };

  constructor(private http: HttpClient) {}

  isLogged(): boolean {
    return this.user !== null;
  }

  get loginStatus$(): Observable<boolean> {
    return this.loginStatusSubject.asObservable();
  }

  login(username: string, password: string): Observable<User | null> {
    const userReq = new HttpParams()
      .set('username', username)
      .set('passwd', password);

    return this.http.post<User>(this.loginUrl, userReq, this.httpOptions).pipe(
      tap(user => {
        this.user = user;
        this.loginStatusSubject.next(true);
      }),
      catchError(this.handleError<User>('login'))
    );
  }

  getUser(): User | null {
    return this.user;
  }

  logout(): void {
    this.user = null; 
    this.loginStatusSubject.next(false);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      this.user = null; 
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T); 
    };
  }
}