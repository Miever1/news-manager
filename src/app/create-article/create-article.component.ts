import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule, FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { ElectronService } from '../services/electron.service';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [
    ToastModule,
    TooltipModule,
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
  @ViewChild('jsonFileUpload') jsonFileUpload: FileUpload | undefined;
  createArticleForm: FormGroup;
  categories: any[] = [];
  selectedThumbnail: SafeUrl | null = null;
  isEditMode: boolean = false;
  articleId: string | null = null;
  imageError: string | null = null;
  isImageSaved: boolean = false;
  isElectronApp: boolean = false;
  pendingInvalidFieldId: string | null = null;
  emptyFormData: any;
  originalArticleData: any = null;

  showRevertButton = false;

  constructor(
    private fb: FormBuilder,
    private newsService: NewsService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private electronService: ElectronService,
    private cdRef: ChangeDetectorRef
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
    this.emptyFormData = { ...this.createArticleForm.value };
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

    if (this.isElectronApp) {
      this.electronService.onNotificationClick(() => {
        if (this.pendingInvalidFieldId) {
          this.scrollToField(this.pendingInvalidFieldId);
          this.pendingInvalidFieldId = null;
        }
      });
    }
  }

  showNotification(type: string, title: string, message: string, invalidFieldId: string | null = null): void {
    if (this.isElectronApp) {
      this.pendingInvalidFieldId = invalidFieldId || null;
      this.electronService.showNotification(title, message);
    } else {
      this.messageService.add({
        severity: type,
        summary: title,
        detail: message,
        key: 'toast',
        data: { invalidFieldId },
        sticky: true,
        closable: true,
      });

      if (invalidFieldId) {
        this.scrollToField(invalidFieldId);
      }
    }
  }

  loadCategories(): void {
    this.newsService.getArticles().subscribe((articles: ArticleList[]) => {
      const uniqueCategories = new Set(articles.map(a => a.category));
      this.categories = Array.from(uniqueCategories).map(c => ({ label: c, value: c }));
    });
  }

  get title() { return this.createArticleForm.get('title')?.value || 'Title will appear here'; }
  get subtitle() { return this.createArticleForm.get('subtitle')?.value || 'Subtitle will appear here'; }
  get abstract() { return this.createArticleForm.get('abstract')?.value || 'Abstract will appear here'; }
  get category() {
    const cat = this.createArticleForm.get('category')?.value;
    return (this.categories.find(c => c.value === cat)?.label) || 'Category will appear here';
  }
  get body() { return this.createArticleForm.get('body')?.value || 'Content will appear here'; }

  private afterJsonImport() {
    this.originalArticleData = { ...this.createArticleForm.value };
    this.showRevertButton = true;
  }

  setArticleValues(article: any) {
    if (!article) return console.error('Invalid article data');
    this.createArticleForm.patchValue({
      title: article.Title || '',
      subtitle: article.Subtitle || '',
      abstract: article.Abstract || '',
      category: article.Category || '',
      body: article.Body || '',
      image_data: '',
      image_media_type: ''
    });
    this.afterJsonImport();
    this.selectedThumbnail = null; 
  }

  loadArticleData(id: string): void {
    this.newsService.getArticle(id).subscribe(article => {
      this.createArticleForm.patchValue({
        title: article.title,
        subtitle: article.subtitle,
        abstract: article.abstract,
        category: article.category,
        body: article.body,
        image_data: article.image_data || '',
        image_media_type: article.image_media_type || ''
      });
      this.originalArticleData = { ...this.createArticleForm.value };
      this.showRevertButton = true;

      if (article.image_data && article.image_media_type) {
        const base64 = `data:${article.image_media_type};base64,${article.image_data}`;
        this.selectedThumbnail = this.sanitizer.bypassSecurityTrustUrl(base64);
      } else {
        this.selectedThumbnail = null;
      }
    });
  }
  
  onSubmit() {
    if (this.createArticleForm.valid) {
      const formData: Article = this.createArticleForm.value;
      const action = this.articleId
        ? this.newsService.updateArticle(formData)
        : this.newsService.createArticle(formData);

      action.subscribe({
        next: () => {
          const msg = this.articleId ? 'Article updated' : 'Article created';
          this.showNotification('success', msg, `${msg} successfully`);
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        },
        error: () => {
          const msg = this.articleId ? 'Failed to update article' : 'Failed to create article';
          this.showNotification('error', 'Error', msg);
        },
      });
    } else {
      const invalidField = this.getFirstInvalidField() || '';
      const fieldLabel = this.getFieldLabel(invalidField || 'Unknown Field');
      const errors = this.getErrorMessagesForField(invalidField);
      this.showNotification('error', `${fieldLabel} is required`, errors.join(' '), invalidField);
    }
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Article Title',
      subtitle: 'Article Subtitle',
      abstract: 'Abstract',
      category: 'Category',
      body: 'Article Body',
    };
    return labels[fieldName] || 'Unknown Field';
  }

  getErrorMessagesForField(fieldName: string): string[] {
    const control = this.createArticleForm.get(fieldName);
    if (!control || !control.errors) return [];
    const errors = control.errors;
    const messages: string[] = [];
    if (errors['required']) messages.push('Please enter a value.');
    return messages;
  }

  getFirstInvalidField(): string | null {
    for (const key of Object.keys(this.createArticleForm.controls)) {
      if (this.createArticleForm.controls[key].invalid) return key;
    }
    return null;
  }

  scrollToField(fieldName: string): void {
    const field = document.getElementById(fieldName);
    if (field) {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inputElement = field as HTMLInputElement;
      setTimeout(() => {
        inputElement.focus();
      }, 300);
    }
  }

  onCancel() {
    this.router.navigate(['/']);
  }

  onFileSelect(event: FileSelectEvent) {
    this.imageError = null;
    const files = event.files;
    if (!files || !files[0]) return;
    const file = files[0];

    if (file.name.toLowerCase().endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const content = (e.target as FileReader).result as string;
          const article = JSON.parse(content);
          this.setArticleValues(article);
        } catch (err) {
          this.showNotification('error', 'Error', 'Failed to parse JSON file');
        }
      };
      reader.onerror = () => this.showNotification('error', 'Error', 'Failed to read file');
      reader.readAsText(file);
    } else {
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
      reader.onload = e => {
        const base64Data = (e.target as FileReader).result as string;
        this.selectedThumbnail = this.sanitizer.bypassSecurityTrustUrl(base64Data);
        const base64Image = base64Data.split(',')[1];
        this.createArticleForm.patchValue({ image_data: base64Image, image_media_type: file.type });
      };
      reader.readAsDataURL(file);
    }
  }
  
  onJsonFileSelect(event: any) {
    const files = event.files;
    if (!files || files.length === 0) {
      this.onRevert();
      return;
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.showNotification('error', 'Error', 'Only JSON files are allowed');
      this.onRevert();
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = (e.target as FileReader).result as string;
        const article = JSON.parse(content);
        this.setArticleValues(article);
      } catch (err) {
        this.showNotification('error', 'Error', 'Failed to parse JSON file');
        this.onRevert();
      }
    };
    reader.onerror = () => {
      this.showNotification('error', 'Error', 'Failed to read file');
      this.onRevert();
    };
    reader.readAsText(file);
  }
  
  onRevert() {
    this.createArticleForm.reset(this.emptyFormData);
    this.selectedThumbnail = null;
    if (this.jsonFileUpload) this.jsonFileUpload.clear();
    this.showRevertButton = false;
    this.cdRef.detectChanges();
  }
}