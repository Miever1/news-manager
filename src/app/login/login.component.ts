import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { PasswordModule } from "primeng/password";
import { InputTextModule } from "primeng/inputtext";
import { LoginService } from '../services/login.service'; 
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ElectronService } from '../services/electron.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ToastModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    PasswordModule,
    FloatLabelModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string | null = null;

  constructor(
    private loginService: LoginService, 
    private router: Router,
    private messageService: MessageService,
    private electronService: ElectronService
  ) {}

  onSubmit(): void {
    this.loginService.login(this.username, this.password).subscribe({
      next: (user) => {
        if (user) {
          if (this.electronService.isElectron()) {
            this.electronService.showNotification('success', 'You have successfully logged in to your News account.');
          } else {
            this.messageService.add({
              severity: 'success',
              summary: `Welcome back, ${user?.username}!`,
              detail: 'You have successfully logged in to your News account.',
            });
          }
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        } else {
          this.error = 'Invalid credentials';
        }
      },
      error: (err) => {
        this.error = 'Login failed: ' + err.message;
      }
    });
  }
}