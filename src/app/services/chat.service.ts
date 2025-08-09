import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse, StreamEvent } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = environment?.API_BASE ?? '/api';
  constructor(private http: HttpClient) {}
  chat(req: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/chat`, req);
  }
  chatStream(req: ChatRequest): Observable<StreamEvent> {
    return new Observable((sub) => {
      fetch(`${this.base}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      })
        .then(async (res) => {
          if (!res.body) throw new Error('No response body');
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';
          const pump = (): any => reader.read().then(({ done, value }) => {
            if (done) { sub.next({ event:'done', data:'1' }); sub.complete(); return; }
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
              const chunk = buffer.slice(0, idx); buffer = buffer.slice(idx + 2);
              let ev = '', data = '';
              for (const line of chunk.split('\n')) {
                if (line.startsWith('event:')) ev = line.slice(6).trim();
                if (line.startsWith('data:'))  data = line.slice(5).trim();
              }
              if (ev) sub.next({ event: ev as any, data });
            }
            return pump();
          });
          return pump();
        })
        .catch(err => { sub.next({ event:'error', data:String(err.message||err) }); sub.complete(); });
      return () => {};
    });
  }
}
