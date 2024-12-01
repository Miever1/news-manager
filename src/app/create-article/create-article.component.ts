import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NewsService } from '../services/news.service';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ArticleList, Article } from '../interfaces/article';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import * as _ from 'lodash';
import { ElectronService } from '../services/electron.service';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MessageModule,
    DropdownModule,
    FileUploadModule,
    InputTextModule,
    ButtonModule,
    DividerModule,
    PanelModule,
    InputTextareaModule,
    CardModule
  ],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css'],
  providers: [MessageService]
})
export class CreateArticleComponent implements OnInit {
  createArticleForm: FormGroup;
  categories: any[] = [];
  selectedThumbnail: SafeUrl | null = null;
  isEditMode: boolean = false;
  articleId: string | null = null;
  imageError: string | null = null;
  isImageSaved: boolean = false;
  isElectronApp: boolean = false;

  constructor(
    private fb: FormBuilder,
    private newsService: NewsService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private electronService: ElectronService
  ) {
    this.createArticleForm = this.fb.group({
      title: ['', [Validators.required]],
      subtitle: ['', [Validators.required]],
      abstract: ['', [Validators.required]],
      category: ['', [Validators.required]],
      body: ['', [Validators.required]],
      image_data: [''],
      image_media_type: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.isElectronApp = this.electronService.isElectron();
    this.route.paramMap.subscribe(params => {
      this.articleId = params.get('id');
      this.isEditMode = !!this.articleId;

      if (this.isEditMode && this.articleId) {
        this.loadArticleData(this.articleId);
      }
    });
  }

  showNotification(type: string, message: string, invalidFieldId: string | null = null): void {
    if (this.isElectronApp) {
      this.electronService.showNotification(
        type === 'success' ? 'Success' : 'Error',
        message
      );
      if (invalidFieldId) {
        this.scrollToField(invalidFieldId);
      }
    } else {
      this.messageService.add({
        severity: type,
        summary: type === 'success' ? 'Success' : 'Error',
        detail: message,
        key: 'toast',
        data: { invalidFieldId },
        sticky: true,
        closable: true,
      });
    }
  }

  loadCategories(): void {
    this.newsService.getArticles().subscribe((articles: ArticleList[]) => {
      const uniqueCategories = new Set(articles.map(article => article.category));
      this.categories = Array.from(uniqueCategories).map(category => ({
        label: category,
        value: category
      }));
    });
  }

  loadArticleData(id: string): void {
    this.newsService.getArticle(id).subscribe(article => {
      this.createArticleForm.patchValue({
        title: article.title,
        subtitle: article.subtitle,
        abstract: article.abstract,
        category: article.category,
        body: article.body
      });

      if (article.image_data && article.image_media_type) {
        const thumbnailBase64 = `data:${article.image_media_type};base64,${article.image_data}`;
        this.selectedThumbnail = this.sanitizer.bypassSecurityTrustUrl(thumbnailBase64);
      }
    });
  }

  get title() {
    return this.createArticleForm.get('title')?.value || 'Title will appear here';
  }

  get subtitle() {
    return this.createArticleForm.get('subtitle')?.value || 'Subtitle will appear here';
  }

  get abstract() {
    return this.createArticleForm.get('abstract')?.value || 'Abstract will appear here';
  }

  get category() {
    const selectedCategory = this.createArticleForm.get('category')?.value;
    const categoryLabel = this.categories.find(c => c.value === selectedCategory)?.label;
    return categoryLabel || 'Category will appear here';
  }

  get body() {
    return this.createArticleForm.get('body')?.value || 'Content will appear here';
  }

  onFileSelect(event: any) {
    this.imageError = null;
    if (event.files && event.files[0]) {
      const file = event.files[0];
      
      const MAX_SIZE = 20971520;
      if (file.size > MAX_SIZE) {
        this.imageError = 'Maximum size allowed is 20MB';
        return;
      }
  
      const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.imageError = 'Only Images are allowed (JPG | PNG)';
        return;
      }
  
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Data = e.target.result;
        this.selectedThumbnail = this.sanitizer.bypassSecurityTrustUrl(base64Data);
  
        const base64Image = base64Data.split(',')[1];
  
        this.createArticleForm.patchValue({
            image_data: base64Image,
            image_media_type: file.type
        });
      };
  
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.createArticleForm.valid) {
      const formData: Article = this.createArticleForm.value;

      if (this.isEditMode && this.articleId) {
        formData.id = this.articleId;
        this.newsService.updateArticle(formData).subscribe({
          next: () => {
            this.showNotification('success', 'Article updated successfully');
            this.router.navigate(['/']);
          },
          error: () => {
            this.showNotification('error', 'Failed to update article');
          },
        });
      } else {
        this.newsService.createArticle(formData).subscribe({
          next: () => {
            this.showNotification('success', 'Article created successfully');
            this.router.navigate(['/']);
          },
          error: () => {
            this.showNotification('error', 'Failed to create article');
          },
        });
      }
    } else {
      const invalidField = this.getFirstInvalidField();
      this.showNotification('error', 'Please fill all the required fields', invalidField);
    }
  }

  getFirstInvalidField(): string | null {
    for (const key of Object.keys(this.createArticleForm.controls)) {
      if (this.createArticleForm.controls[key].invalid) {
        return key;
      }
    }
    return null;
  }

  scrollToField(fieldName: string): void {
    const field = document.getElementById(fieldName);
    if (field) {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (field as HTMLElement).focus();
    }
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}