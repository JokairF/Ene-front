// src/app/chat/chat.component.ts
import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../models/chat.models';
// import { HttpErrorResponse } from '@angular/common/http'; // (unused) remove

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  sessionId = uuidv4();
  input = '';
  messages: ChatMessage[] = [];
  streaming = false;

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('ene.sessionId');
    if (saved) this.sessionId = saved;
    else localStorage.setItem('ene.sessionId', this.sessionId);
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      if (!this.messagesContainer) return;
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.push(msg);
    this.scrollToBottom();
  }

  send(useStream = false): void { // CHANGED: no async
    const text = this.input.trim();
    if (!text) return;

    this.addMessage({ role: 'user', content: text });
    this.input = '';

    if (!useStream) {
      this.chat.chat({
        session_id: this.sessionId,
        message: text,
        style: { personality: 'ene', reply_style: 'immersive', min_words: 80 },
        gen: { temperature: 0.7, max_tokens: 256 }
      }).subscribe({
        next: res => {
          this.messages = res.history;
          this.scrollToBottom();
        },
        error: err => {
          console.error('POST /chat error:', err);
          this.addMessage({ role: 'assistant', content: `Erreur: ${this.formatError(err)}` }); // CHANGED
        }
      });
      return;
    }

    // --- Streaming ---
    this.streaming = true;
    let assistantBuffer = '';

    const pushOrUpdate = () => {
      const last = this.messages[this.messages.length - 1];
      if (!last || last.role !== 'assistant') {
        this.addMessage({ role: 'assistant', content: assistantBuffer });
      } else {
        last.content = assistantBuffer;
        this.scrollToBottom();
      }
    };

    this.chat.chatStream({
      session_id: this.sessionId,
      message: text,
      style: { personality: 'ene', reply_style: 'immersive' },
      gen: { temperature: 0.7, max_tokens: 256 }
    }).subscribe({
      next: ev => {
        if (ev.event === 'token') {
          assistantBuffer += ev.data;
          pushOrUpdate();
        } else if (ev.event === 'error') {
          this.streaming = false;
          console.error('SSE error:', ev.data);
          assistantBuffer += `\n[Erreur: ${this.formatError(ev.data)}]`; // CHANGED
          pushOrUpdate();
        } else if (ev.event === 'done') {
          this.streaming = false;
          localStorage.setItem('ene.sessionId', this.sessionId);
        }
      },
      error: e => {
        this.streaming = false;
        console.error('POST /chat/stream error:', e);
        this.addMessage({ role: 'assistant', content: `Erreur: ${this.formatError(e)}` }); // CHANGED
      }
    });
  }

  get isTyping() {
    return this.streaming &&
      this.messages.length > 0 &&
      this.messages[this.messages.length - 1].role === 'assistant';
  }
  get isEmpty() {
    return this.messages.length === 0;
  }

  private formatError(e: any): string {
    if (e && typeof e === 'string') return e;                 // string direct
    if (e?.error?.detail) return String(e.error.detail);      // FastAPI {detail: "..."}
    if (typeof e?.error === 'string') return e.error;         // payload texte
    if (e?.message) return e.message;                         // Error.message
    try { return JSON.stringify(e); } catch { return String(e); }
  }
}
