export interface ArticleList {
    id: string;
    aut: string;
    title: string;
    abstract: string;
    subtitle: string;
    category: string;
    thumbnail_image: string;
    thumbnail_media_type: string;
    update_date: string;
    username: string;
}

export interface Article {
    id: string;
    aut: string;
    title: string;
    abstract: string;
    subtitle: string;
    category: string;
    thumbnail_image: string;
    thumbnail_media_type: string;
    update_date: string;
    username: string;
    body?: string;
    image_data?: string;
    image_description?: string;
}