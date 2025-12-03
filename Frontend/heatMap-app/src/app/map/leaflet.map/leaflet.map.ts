import {AfterViewInit, Component, OnInit} from '@angular/core';
import * as L from 'leaflet';
import {HeatmapService} from '../services/heatmap.service';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [],
  templateUrl: './leaflet.map.html',
  styleUrls: ['./leaflet.map.css',]
})
export class LeafletMapComponent implements  AfterViewInit{
  map:any

  constructor(private heatmapService: HeatmapService) {}

  ngAfterViewInit() {
  this.configureMap()

    this.heatmapService.getHeatmap().subscribe(data => {
      console.log('GeoJSON recebido:', data);

      const geoLayer = L.geoJSON(data, {
        style: feature => ({
          color: feature?.properties?.color || 'blue',
          weight: 2,
          fillOpacity: 0.5
        }),
        onEachFeature: (feature, layer) => {
          if (feature.properties?.label) {
            layer.bindPopup(feature.properties.label);
          }
        }
      }).addTo(this.map);
      this.map.fitBounds(geoLayer.getBounds());
    });
}


  configureMap() {
    this.map = L.map('map', {
      center: [-26.9180776, -49.0745391],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }
}
