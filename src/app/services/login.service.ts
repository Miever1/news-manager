import { Injectable } from '@angular/core';
import { User } from '../interfaces/user'; 
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ElectronService } from '../services/electron.service';

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

  constructor(private http: HttpClient, private electronService: ElectronService) {
    this.user = this.loadUserFromStorage();
  }

  isLogged(): boolean {
    if (!this.user) {
      this.user = this.loadUserFromStorage();
    }

    if (this.user) {
      const now = new Date();
      const expires = new Date(this.user.expires);

      if (expires <= now) {
        this.logout();
        return false;
      }

      return true;
    }

    return false;
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
        this.saveUserToStorage(user);
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
    this.clearUserFromStorage();
    this.loginStatusSubject.next(false);
  }

  private saveUserToStorage(user: User): void {
    if (this.electronService.isElectron()) {
      window.electronStore.set('loggedInUser', user); 
      console.log('Saving user to storage:', window.electronStore.get('loggedInUser'));
    } else {
      localStorage.setItem('loggedInUser', JSON.stringify(user)); 
    }
  }

  private loadUserFromStorage(): User | null {
    try {
      if (this.electronService.isElectron()) {
        const userData = window.electronStore.get('loggedInUser');
        return userData as User | null;
      } else {
        const userData = localStorage.getItem('loggedInUser');
        return userData ? JSON.parse(userData) : null;
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.clearUserFromStorage();
      return null;
    }
  }

  private clearUserFromStorage(): void {
    try {
      if (this.electronService.isElectron()) {
        window.electronStore.delete('loggedInUser'); 
      } else {
        localStorage.removeItem('loggedInUser'); 
      }
    } catch (error) {
      console.error('Error clearing user data from storage:', error);
    }
  }

  private isUserLoggedIn(): boolean {
    if (this.user) {
      const now = new Date();
      const expires = new Date(this.user.expires);
      return expires > now;
    }
    return false;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.user = null; 
      this.clearUserFromStorage();
      return of(result as T); 
    };
  }
}