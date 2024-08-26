import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  menuOpen = true;

  constructor(private router: Router) {}

  ngOnInit() {
    // Inicializa menuOpen com base na largura da janela
    this.menuOpen = window.innerWidth > 550;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    // Atualiza menuOpen sempre que a janela é redimensionada
    this.menuOpen = window.innerWidth > 550;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['login']);
  }
}
