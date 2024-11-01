import { Component, OnInit, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';
export interface NeedRequest {
    needs: string[];
    otherNeeds: string;
    location: {
      lat: number;
      lng: number;
    };
    timestamp: Date;
  }

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
})

export class LandPageComponent implements OnInit {
    isApp: boolean = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    iconjsd: string = 'assets/img/land/logos/sjd_en.png';
    iconmoh: string = 'assets/img/land/logos/MoH_en.png';
    lang: string = 'es';
    lat: number = 39.4699; // Coordenadas por defecto de Valencia
    lng: number = -0.3763;
    zoom: number = 7;
    needs: string[] = [];
    otherNeeds: string = '';
    locationDenied: boolean = false;
    browserName: string;
    map: any;
    mapClickListener: any;
    showMarker: boolean = false;
    private apiUrl = environment.api + '/api/needs';
    isSubmitting: boolean = false;
    needsList = [
        { id: 'electricity', label: 'Falta de electricidad' },
        { id: 'water', label: 'Falta de agua potable' },
        { id: 'food', label: 'Necesidad de alimentos' },
        { id: 'medicines', label: 'Necesidad de medicamentos' },
        { id: 'medical_assistance', label: 'Necesidad de asistencia sanitaria' }
    ];

    constructor(public translate: TranslateService, private zone: NgZone, private http: HttpClient) {
        this.lang = sessionStorage.getItem('lang') || 'es';
        this.detectBrowser();
    }

    detectBrowser() {
        const agent = window.navigator.userAgent.toLowerCase();
        if (agent.indexOf('chrome') > -1) {
            this.browserName = 'chrome';
        } else if (agent.indexOf('firefox') > -1) {
            this.browserName = 'firefox';
        } else if (agent.indexOf('safari') > -1) {
            this.browserName = 'safari';
        } else if (agent.indexOf('edge') > -1 || agent.indexOf('edg') > -1) {
            this.browserName = 'edge';
        } else {
            this.browserName = 'other';
        }
    }


    ngOnInit() {
        this.getCurrentLocation();
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.lat = position.coords.latitude;
                    this.lng = position.coords.longitude;
                    this.locationDenied = false;
                    console.log('Location obtained:', this.lat, this.lng);
                    this.showMarker = false;
                }, 
                (error) => {
                    console.log('Error de geolocalización:', error);
                    this.locationDenied = true;
                    
                    if (error.code === 1) { // Permiso denegado
                        this.showLocationInstructions();
                    } else {
                        this.lat = 39.4699; // Valencia
                        this.lng = -0.3763;
                        Swal.fire({
                            icon: 'error',
                            title: 'Error de ubicación',
                            text: 'No se pudo obtener tu ubicación. Por favor, marca tu ubicación en el mapa manualmente.',
                            confirmButtonText: 'Entendido'
                        });
                    }
                }
            );
        }
    }

    showLocationInstructions() {
        let instructions = `
            <p class="mb-2">Tu ubicación nos ayuda a:</p>
            <ul class="text-left mb-4">
                <li>Crear un mapa de necesidades en tiempo real</li>
                <li>Coordinar la ayuda de manera más eficiente</li>
                <li>Priorizar las zonas más afectadas</li>
                <li>Distribuir los recursos disponibles donde más se necesitan</li>
            </ul>
            <p class="mb-2">Para activar la ubicación:</p>
            <ol class="text-left mb-2">
                <li>Haz clic en el icono del candado en la barra de direcciones</li>
                <li>Busca "Ubicación" en los permisos</li>
                <li>Selecciona "Permitir"</li>
            </ol>`;
    
        Swal.fire({
            icon: 'info',
            title: 'Ayúdanos a coordinar mejor la ayuda',
            html: instructions,
            showCancelButton: true,
            confirmButtonText: 'Intentar de nuevo',
            cancelButtonText: 'Marcar ubicación manualmente',
            confirmButtonColor: '#2196F3',
            cancelButtonColor: '#757575',
            width: '600px'
        }).then((result) => {
            if (result.isConfirmed) {
                this.getCurrentLocation();
            }else{
                this.showMarker = true;
                this.centerValencia();
            }
        });
    }

 

    deletelocation(){
        this.lat = null
        this.lng = null
        this.showMarker = false;
      }

      submitNeed(needRequest: NeedRequest): Observable<any> {
        return this.http.post(this.apiUrl, needRequest);
      }

      toggleNeed(need: string) {
        const index = this.needs.indexOf(need);
        if (index === -1) {
            this.needs.push(need);
        } else {
            this.needs.splice(index, 1);
        }
    }

      async submitNeeds() {
        console.log(this.needs);
        console.log(this.otherNeeds);
        if (this.needs.length === 0 && !this.otherNeeds) {
            Swal.fire({
                icon: 'warning',
                text: 'Por favor, selecciona al menos una necesidad o describe tu situación',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        // Aquí iría la lógica para enviar los datos al backend
        const needRequest: NeedRequest = {
            needs: this.needs,
            otherNeeds: this.otherNeeds,
            location: {
                lat: this.lat,
                lng: this.lng
            },
            timestamp: new Date()
        };

        try {
            this.isSubmitting = true;
            
            // Mostrar loading
            Swal.fire({
                title: 'Enviando solicitud',
                text: 'Por favor, espera...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await this.submitNeed(needRequest).toPromise();
            
            // Mostrar éxito
            Swal.fire({
                icon: 'success',
                title: 'Solicitud enviada',
                text: 'Tu solicitud ha sido registrada correctamente. Las autoridades y organizaciones de ayuda han sido notificadas.',
                confirmButtonText: 'Aceptar'
            });

            // Reset formulario
            this.needs = [];
            this.otherNeeds = '';
            
        } catch (error) {
            console.error('Error al enviar la solicitud:', error);
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ha ocurrido un error al enviar tu solicitud. Por favor, inténtalo de nuevo.',
                confirmButtonText: 'Entendido'
            });
        } finally {
            this.isSubmitting = false;
        }
    }

    centerValencia() {
        this.lat = 39.4699;
        this.lng = -0.3763;
        this.zoom = 7;
        this.showMarker = true;
    }

    
    changePickupMarkerLocation($event: { coords: any }) {
        this.lat = $event.coords.lat;
        this.lng = $event.coords.lng;
        this.showMarker = true;
      }
    
      mapReadyHandler(map: google.maps.Map): void {
        this.map = map;
        this.mapClickListener = this.map.addListener('click', (e: google.maps.MouseEvent) => {
          this.zone.run(() => {
            // Here we can get correct event
            this.lat = e.latLng.lat();
            this.lng = e.latLng.lng();
            this.showMarker = true;
          });
        });
      }

}
