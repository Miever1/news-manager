import { Injectable } from '@angular/core';
import { User } from '../interfaces/user'; 
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private user: User | null = null;
  private loginUrl = `${environment.apiBaseUrl}/login`;
  private loginStatusSubject = new BehaviorSubject<boolean>(this.isUserLoggedIn());

  private httpOptions = {
    headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
  };

  constructor(private http: HttpClient) {
    this.user = this.loadUserFromLocalStorage();
  }

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
        this.saveUserToLocalStorage(user);
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
    this.clearUserFromLocalStorage();
    this.loginStatusSubject.next(false);
  }

  private saveUserToLocalStorage(user: User): void {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  }

  private loadUserFromLocalStorage(): User | null {
    const userData = localStorage.getItem('loggedInUser');
    return userData ? JSON.parse(userData) : null;
  }

  private clearUserFromLocalStorage(): void {
    localStorage.removeItem('loggedInUser');
  }

  private isUserLoggedIn(): boolean {
    return !!localStorage.getItem('loggedInUser');
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      this.user = null; 
      return of(result as T); 
    };
  }
}​