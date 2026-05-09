export interface User {
  id?: string;
  name?: string;
  username: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user?: User; // In case login returns user as well
}

export interface NotePayload {
  title: string;
  content: string;
  content_type: string;
  status: string;
  is_public?: boolean;
  source_url?: string;
  source_title?: string;
}

export interface WebArticlePayload {
  url: string;
  title: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}
