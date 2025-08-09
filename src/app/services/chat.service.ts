import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse, StreamEvent } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = environment?.API_BASE ?? '/api';

  constructor(private http: HttpClient) {}

  // On s’assure de NE PAS envoyer de `system`
  private sanitize(req: ChatRequest): ChatRequest {
    const { session_id, message, style, gen } = req;
    return { session_id, message, style, gen };
  }

  chat(req: ChatRequest): Observable<ChatResponse> {
    const body = this.sanitize(req);
    return this.http.post<ChatResponse>(`${this.base}/chat`, body);
  }

  /**
   * SSE via fetch (Angular HttpClient ne gère pas SSE natif simplement).
   * On fournit une option d’annulation via AbortController.
   */
  chatStream(req: ChatRequest, controller?: AbortController): Observable<StreamEvent> {
    const body = JSON.stringify(this.sanitize(req));
    return new Observable<StreamEvent>((sub) => {
      const aborter = controller ?? new AbortController();

      fetch(`${this.base}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: aborter.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || `HTTP ${res.status}`);
          }
          if (!res.body) throw new Error('No response body');

          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          const pump = (): any =>
            reader.read().then(({ done, value }) => {
              if (done) {
                sub.next({ event: 'done', data: '1' });
                sub.complete();
                return;
              }
              buffer += decoder.decode(value, { stream: true });

              let idx: number;
              while ((idx = buffer.indexOf('\n\n')) !== -1) {
                const chunk = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);

                let ev = '';
                let data = '';
                for (const line of chunk.split('\n')) {
                  if (line.startsWith('event:')) ev = line.slice(6).trim();
                  if (line.startsWith('data:')) data = line.slice(5).trim();
                }
                if (ev) sub.next({ event: ev as any, data });
              }

              return pump();
            });

          return pump();
        })
        .catch((err) => {
          // On envoie une erreur “propre”
          sub.next({ event: 'error', data: String(err?.message ?? err) });
          sub.complete();
        });

      // Cleanup: annuler le stream si l’observable est unsubscribed
      return () => aborter.abort();
    });
  }
}
