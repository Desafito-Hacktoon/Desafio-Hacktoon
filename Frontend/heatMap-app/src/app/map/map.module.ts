import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletMapComponent } from './leaflet.map/leaflet.map';



@NgModule({
  declarations: [],
  imports: [
    CommonModule, LeafletMapComponent
  ],
  exports: [LeafletMapComponent],
})
export class MapModule {



}
