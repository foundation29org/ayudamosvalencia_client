import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
declare const google: any;

export interface NeedRequest {
  needs: string[];
  otherNeeds: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  status?: string; 
}
@Component({
    selector: 'app-mapa',
    templateUrl: './mapa.component.html',
    styleUrls: ['./mapa.component.scss']
})

export class MapaPageComponent2 implements OnInit{
  @ViewChild('mapContainer') mapContainer: any;
  
  center = {
    lat: 39.4699, // Valencia center
    lng: -0.3763
  };
  zoom = 7;
  
  needs: NeedRequest[] = [];
  filteredNeeds: NeedRequest[] = [];
  selectedNeedType: string = 'all';
  heatmapLayer: any;
  map: any;
  
  mapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    maxZoom: 20,
    minZoom: 8,
  };
  
  needTypes = [
    { id: 'all', label: 'Todas las necesidades' },
    { id: 'electricity', label: 'Suministro de electricidad' },
    { id: 'water', label: 'Agua potable' },
    { id: 'sumwater', label: 'Suministro de agua' },
    { id: 'food', label: 'Alimentos' },
    { id: 'alojamiento', label: 'Alojamiento' },
    { id: 'ropa', label: 'Ropa' },
    { id: 'other', label: 'Otras necesidades' }
  ];


  private apiUrl = environment.api + '/api/needs';
  constructor(public translate: TranslateService, private http: HttpClient) { }

  ngOnInit() {
    this.loadNeeds();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: this.center,
      zoom: this.zoom,
      ...this.mapOptions
    });

    this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
      map: this.map,
      data: [],
      radius: 20,
      opacity: 0.8,
      gradient: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
    });
  }


  getAllNeeds(): Observable<NeedRequest[]> {
    return this.http.get<{ data: NeedRequest[] }>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  async loadNeeds() {
    try {
      this.needs = await this.getAllNeeds().toPromise();
      this.filterNeeds();
    } catch (error) {
      console.error('Error loading needs:', error);
    }
  }

  filterNeeds() {
    // Primero filtrar las necesidades que no están helped
    const activeNeeds = this.needs.filter(need => need.status !== 'helped');
    console.log(activeNeeds);
    if (this.selectedNeedType === 'all') {
        this.filteredNeeds = activeNeeds;
    } else if (this.selectedNeedType === 'other') {
        this.filteredNeeds = activeNeeds.filter(need => 
            need.otherNeeds && need.otherNeeds.trim().length > 0
        );
    } else {
        this.filteredNeeds = activeNeeds.filter(need => 
            need.needs.includes(this.selectedNeedType)
        );
    }
    this.updateHeatmap();
    }

  updateHeatmap() {
    if (this.heatmapLayer) {
      const heatmapData = this.filteredNeeds.map(need => ({
        location: new google.maps.LatLng(need.location.lat, need.location.lng),
        weight: 1
      }));
      
      this.heatmapLayer.setData(heatmapData);
    }
  }

  onMapInitialized(event: any) {
    const map = this.map.googleMap;
    if (map) {
      this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
        map: map,
        data: [],
        radius: 20,
        opacity: 0.8,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
        ]
      });
      this.filterNeeds();
    }
  }

  onNeedTypeChange(needType: string) {
    this.selectedNeedType = needType;
    this.filterNeeds();
  }

  getNeedStats() {
    const stats = {
        total: this.needs.length,
        byType: {} as {[key: string]: number}
    };

    this.needTypes.forEach(type => {
        if (type.id === 'all') return;
        
        if (type.id === 'other') {
            stats.byType[type.id] = this.needs.filter(need => 
                need.otherNeeds && need.otherNeeds.trim().length > 0
            ).length;
        } else {
            stats.byType[type.id] = this.needs.filter(need => 
                need.needs.includes(type.id)
            ).length;
        }
    });

    return stats;
}

}
