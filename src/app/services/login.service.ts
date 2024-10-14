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
  private loginStatusSubject = new BehaviorSubject<boolean>(this.isUserLoggedIn());

  private httpOptions = {
    headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
  };

  constructor(private http: HttpClient) {
    this.user = this.loadUserFromLocalStorage(); // Load user from localStorage on init
  }

  // Check if user is logged in by checking the presence of user data in localStorage
  isLogged(): boolean {
    return this.user !== null;
  }

  get loginStatus$(): Observable<boolean> {
    return this.loginStatusSubject.asObservable();
  }

  // Perform login and store the user in localStorage
  login(username: string, password: string): Observable<User | null> {
    const userReq = new HttpParams()
      .set('username', username)
      .set('passwd', password);

    return this.http.post<User>(this.loginUrl, userReq, this.httpOptions).pipe(
      tap(user => {
        this.user = user;
        this.saveUserToLocalStorage(user);  // Save user to localStorage
        this.loginStatusSubject.next(true);
      }),
      catchError(this.handleError<User>('login'))
    );
  }

  getUser(): User | null {
    return this.user;
  }

  // Perform logout and remove user from localStorage
  logout(): void {
    this.user = null; 
    this.clearUserFromLocalStorage();  // Remove user from localStorage
    this.loginStatusSubject.next(false);
  }

  // Utility function to save user to localStorage
  private saveUserToLocalStorage(user: User): void {
    localStorage.setItem('loggedInUser', JSON.stringify(user)); // Save as JSON string
  }

  // Utility function to load user from localStorage
  private loadUserFromLocalStorage(): User | null {
    const userData = localStorage.getItem('loggedInUser');
    return userData ? JSON.parse(userData) : null;  // Parse back to User object
  }

  // Utility function to clear user from localStorage
  private clearUserFromLocalStorage(): void {
    localStorage.removeItem('loggedInUser');
  }

  // Check if user data exists in localStorage
  private isUserLoggedIn(): boolean {
    return !!localStorage.getItem('loggedInUser');
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      this.user = null; 
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T); 
    };
  }
}