import { Injectable } from '@angular/core';
import { User } from '../interfaces/user'; 
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ElectronService } from '../services/electron.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private user: User | null = null;
  private loginUrl = `${environment.apiBaseUrl}/login`;
  private loginStatusSubject = new BehaviorSubject<boolean>(false);
  loginStatus$ = this.loginStatusSubject.asObservable();
  private httpOptions = {
    headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
  };

  constructor(private http: HttpClient, private electronService: ElectronService) {
    this.initializeUser();
  }
  
  private async initializeUser() {
    this.user = await this.loadUserFromStorage();
    this.loginStatusSubject.next(!!this.user);
  }

  isLogged(): boolean {
    return this.loginStatusSubject.value;
  }

  login(username: string, password: string): Observable<User | null> {
    const userReq = new HttpParams()
      .set('username', username)
      .set('passwd', password);

    return this.http.post<User>(this.loginUrl, userReq, this.httpOptions).pipe(
      tap((user) => {
        if (user && user.expires) {
          this.user = user;
          this.saveUserToStorage(user);
          this.loginStatusSubject.next(true);
        }
      }),
      catchError(this.handleError<User>('login', undefined))
    );
  }

  getUser(): Promise<User | null> {
    return Promise.resolve(this.user);
  }

  logout(): void {
    this.user = null;
    this.clearUserFromStorage();
    this.loginStatusSubject.next(false);
  }

  private saveUserToStorage(user: any): void {
    try {
      const expiresInHours = 24 * 7;
      user.expires = new Date(new Date().getTime() + expiresInHours * 60 * 60 * 1000).toISOString();
  
      if (this.electronService.isElectron()) {
        window.electronStore.set('loggedInUser', user);
      } else {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  private async loadUserFromStorage(): Promise<User | null> {
    try {
      let userData: any;
  
      if (this.electronService.isElectron()) {
        userData = await window.electronStore.get('loggedInUser');
      } else {
        userData = localStorage.getItem('loggedInUser');
        userData = userData ? JSON.parse(userData) : null;
      }
  
      if (userData && this.validateUser(userData)) {
        return userData.value || userData;
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  
    this.clearUserFromStorage();
    return null;
  }

  private validateUser(user: any): boolean {
    const actualUserData = user.value || user;
  
    if (!actualUserData || !actualUserData.expires) {
      console.warn('User validation failed: Missing user or expires field');
      return false;
    }
  
    const expires = new Date(actualUserData.expires);
  
    if (isNaN(expires.getTime()) || expires <= new Date()) {
      return false;
    }
  
    return true;
  }

  private clearUserFromStorage(): void {
    try {
      if (this.electronService.isElectron()) {
        console.log('[clearUserFromStorage] Deleting from electronStore');
        window.electronStore.delete('loggedInUser');
      } else {
        console.log('[clearUserFromStorage] Removing from localStorage');
        localStorage.removeItem('loggedInUser');
      }
    } catch (error) {
      console.error('[clearUserFromStorage] Error clearing user data from storage:', error);
    }
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