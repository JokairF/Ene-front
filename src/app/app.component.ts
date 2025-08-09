import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // pour afficher les routes
  template: `
    <nav>
      <a routerLink="/">Accueil</a>
      <a routerLink="/chat">Chat</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [`
    nav { display: flex; gap: 1rem; margin-bottom: 1rem; }
    a { color: #8ab4f8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  `]
})
export class AppComponent {
title = 'ene-ui';
}
