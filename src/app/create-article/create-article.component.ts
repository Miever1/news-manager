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

  constructor(
    private fb: FormBuilder,
    private newsService: NewsService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private sanitizer: DomSanitizer
  ) {
    this.createArticleForm = this.fb.group({
      title: ['', [Validators.required]],
      subtitle: ['', [Validators.required]],
      abstract: ['', [Validators.required]],
      category: ['', [Validators.required]],
      body: ['', [Validators.required]],
      thumbnail: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();

    this.route.paramMap.subscribe(params => {
      this.articleId = params.get('id');
      this.isEditMode = !!this.articleId;

      if (this.isEditMode && this.articleId) {
        this.loadArticleData(this.articleId);
      }
    });
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

  onSubmit() {
    if (this.createArticleForm.valid) {
      const formData: Article = this.createArticleForm.value;

      if (this.isEditMode && this.articleId) {
        formData.id = this.articleId;
        this.newsService.updateArticle(formData).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Article updated successfully' });
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update article' });
          }
        });
      } else {
        this.newsService.createArticle(formData).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Article created successfully' });
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create article' });
          }
        });
      }
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all the required fields' });
    }
  }

  onFileSelect(event: any) {
    const file = event.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.selectedThumbnail = this.sanitizer.bypassSecurityTrustUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);

    this.createArticleForm.patchValue({
      thumbnail: file
    });
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}