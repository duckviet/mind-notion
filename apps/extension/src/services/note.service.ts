import { CONFIG } from "../core/config";
import { NotePayload, WebArticlePayload } from "../core/types";
import { HttpService } from "./http.service";
import { storageService } from "./storage.service";

class NoteService extends HttpService {
  protected async getAccessToken(): Promise<string | null> {
    return storageService.getAccessToken();
  }

  async saveSelectedText(data: Partial<NotePayload> & { content: string }): Promise<any> {
    return this.request(CONFIG.API_ENDPOINTS.CREATE_NOTE, {
      method: "POST",
      body: JSON.stringify({
        title: data.source_title || data.title || "Saved from extension",
        content: data.content,
        content_type: data.content_type || "text",
        status: data.status || "draft",
        is_public: data.is_public || false,
      }),
    });
  }

  async saveWebArticle(data: WebArticlePayload): Promise<any> {
    return this.request(CONFIG.API_ENDPOINTS.ADD_WEB_ARTICLE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const noteService = new NoteService();
