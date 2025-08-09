import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  { path: '', component: ChatComponent },  // page d'accueil
  { path: 'chat', component: ChatComponent }, // alias /chat
  { path: '**', redirectTo: '' } // fallback
];
