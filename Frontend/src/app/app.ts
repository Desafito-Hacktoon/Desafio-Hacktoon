import { Component, signal } from '@angular/core';
import {RouterLink, RouterOutlet, Router, NavigationEnd} from '@angular/router';
import { filter } from 'rxjs/operators';
import { MapModule } from './map/map.module';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { HeaderComponent as ZHeaderComponent } from './shared/components/layout/header.component';
import { ContentComponent } from './shared/components/layout/content.component';
import { SidebarComponent as ZSidebarComponent, SidebarGroupComponent, SidebarGroupLabelComponent } from './shared/components/layout/sidebar.component';
import { ZardIconComponent } from './shared/components/icon/icon.component';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [
    RouterOutlet, 
    MapModule, 
    RouterLink, 
    LayoutComponent,
    ZHeaderComponent,
    ContentComponent,
    ZSidebarComponent,
    SidebarGroupComponent,
    ZardIconComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('heatMap-app');
  currentPageTitle = signal('Dashboard');

  private pageTitles: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/mapa': 'Mapa',
    '/ocorrencias': 'Ocorrências'
  };

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.currentPageTitle.set(this.pageTitles[url] || 'Dashboard');
      });

    const currentUrl = this.router.url;
    this.currentPageTitle.set(this.pageTitles[currentUrl] || 'Dashboard');
  }
}
