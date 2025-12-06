import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink, RouterOutlet, Router, NavigationEnd} from '@angular/router';
import { filter } from 'rxjs/operators';
import { MapModule } from './map/map.module';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { HeaderComponent as ZHeaderComponent } from './shared/components/layout/header.component';
import { ContentComponent } from './shared/components/layout/content.component';
import { SidebarComponent as ZSidebarComponent, SidebarGroupComponent, SidebarGroupLabelComponent } from './shared/components/layout/sidebar.component';
import { ZardIconComponent } from './shared/components/icon/icon.component';
import { ZardButtonComponent } from './shared/components/button/button.component';
import { UserMenuComponent } from './shared/components/user-menu/user-menu.component';
import {AuthService} from "./auth/service/auth";
import { type ZardIcon } from './shared/components/icon/icons';


@Component({
  selector: 'app-root',
  standalone:true,
  imports: [
    CommonModule,
    RouterOutlet, 
    MapModule, 
    RouterLink, 
    LayoutComponent,
    ZHeaderComponent,
    ContentComponent,
    ZSidebarComponent,
    SidebarGroupComponent,
    SidebarGroupLabelComponent,
    ZardIconComponent,
    ZardButtonComponent,
    UserMenuComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('heatMap-app');
  currentPageTitle = signal('Dashboard');
  currentPageIcon = signal<ZardIcon>('layout-dashboard');
  isAuthPage = signal(false);

  private pageTitles: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/mapa': 'Mapa',
    '/ocorrencias': 'Ocorrências',
    '/relatorios-ia': 'Relatórios IA',
    '/relatorios-ia/gerar': 'Gerar Relatório',
    '/insights-ia': 'Insights IA',
    '/insights-ia/gerar': 'Gerar Insight'
  };

  private pageIcons: { [key: string]: ZardIcon } = {
    '/dashboard': 'layout-dashboard',
    '/mapa': 'layers',
    '/ocorrencias': 'file-text',
    '/relatorios-ia': 'clipboard',
    '/relatorios-ia/gerar': 'file-text',
    '/insights-ia': 'lightbulb',
    '/insights-ia/gerar': 'lightbulb'
  };

  getPageIcon(url: string): ZardIcon {
    const urlWithoutQuery = url.split('?')[0];
    // Para rotas com parâmetros dinâmicos (ex: /ocorrencias/:id), verifica se começa com o prefixo
    if (urlWithoutQuery.startsWith('/ocorrencias/') && urlWithoutQuery !== '/ocorrencias') {
      return 'file-text';
    }
    if (urlWithoutQuery.startsWith('/relatorios-ia/') && urlWithoutQuery !== '/relatorios-ia' && urlWithoutQuery !== '/relatorios-ia/gerar') {
      return 'clipboard';
    }
    return this.pageIcons[urlWithoutQuery] || 'layout-dashboard';
  }

  getPageTitle(url: string): string {
    const urlWithoutQuery = url.split('?')[0];
    // Para rotas com parâmetros dinâmicos (ex: /ocorrencias/:id), verifica se começa com o prefixo
    if (urlWithoutQuery.startsWith('/ocorrencias/') && urlWithoutQuery !== '/ocorrencias') {
      return 'Detalhes da Ocorrência';
    }
    if (urlWithoutQuery.startsWith('/relatorios-ia/') && urlWithoutQuery !== '/relatorios-ia' && urlWithoutQuery !== '/relatorios-ia/gerar') {
      return 'Detalhes do Relatório';
    }
    return this.pageTitles[urlWithoutQuery] || 'Dashboard';
  }

  constructor(
    public router: Router,
    public auth: AuthService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        const urlWithoutQuery = url.split('?')[0];
        this.isAuthPage.set(urlWithoutQuery === '/login' || urlWithoutQuery === '/register');
        this.currentPageTitle.set(this.getPageTitle(url));
        this.currentPageIcon.set(this.getPageIcon(url));
      });

    const currentUrl = this.router.url;
    const urlWithoutQuery = currentUrl.split('?')[0];
    this.isAuthPage.set(urlWithoutQuery === '/login' || urlWithoutQuery === '/singup');
    this.currentPageTitle.set(this.getPageTitle(currentUrl));
    this.currentPageIcon.set(this.getPageIcon(currentUrl));
  }
}
