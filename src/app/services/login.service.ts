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
    this.user = this.loadUserFromStorage();
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

  getUser(): User | null {
    return this.user;
  }

  logout(): void {
    this.user = null;
    this.clearUserFromStorage();
    this.loginStatusSubject.next(false);
  }

  private saveUserToStorage(user: User): void {
    try {
      if (this.electronService.isElectron()) {
        window.electronStore.set('loggedInUser', user);
      } else {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  private loadUserFromStorage(): User | null {
    try {
      let userData: any;
      if (this.electronService.isElectron()) {
        userData = window.electronStore.get('loggedInUser');
      } else {
        userData = localStorage.getItem('loggedInUser');
        userData = userData ? JSON.parse(userData) : null;
      }

      if (userData && this.validateUser(userData)) {
        return userData as User;
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }

    this.clearUserFromStorage();
    return null;
  }

  private validateUser(user: any): boolean {
    if (!user || !user.expires) {
      return false;
    }

    const expires = new Date(user.expires);
    return !isNaN(expires.getTime()) && expires > new Date();
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

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.user = null;
      this.clearUserFromStorage();
      return of(result as T);
    };
  }
}