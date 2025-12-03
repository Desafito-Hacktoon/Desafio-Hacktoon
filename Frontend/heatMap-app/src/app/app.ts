import { Component, signal } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import { MapModule } from './map/map.module';


@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet, MapModule, RouterLink],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('heatMap-app');
}
