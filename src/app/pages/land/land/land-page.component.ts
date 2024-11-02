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
    lang: string = 'es';
    lat: number = 39.4699; // Coordenadas por defecto de Valencia
    lng: number = -0.3763;
    needs: string[] = [];
    otherNeeds: string = '';
    locationDenied: boolean = true;
    browserName: string;
    private apiUrl = environment.api + '/api/needs';
    isSubmitting: boolean = false;
    needsList = [
        { id: 'electricity', label: 'Suministro de electricidad' },
        { id: 'water', label: 'Agua potable' },
        { id: 'sumwater', label: 'Suministro de agua' },
        { id: 'food', label: 'Alimentos' },
        { id: 'alojamiento', label: 'Alojamiento' },
        { id: 'ropa', label: 'Ropa' },
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
        console.log(navigator.geolocation)
        if (navigator.geolocation) {
            console.log('Obteniendo ubicación...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.lat = position.coords.latitude;
                    this.lng = position.coords.longitude;
                    this.locationDenied = false;
                    console.log('Location obtained:', this.lat, this.lng);
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
                            html: 'No se pudo obtener tu ubicación. <br><br>' +
                                 'Si ya has dado permiso de ubicación, por favor intenta <strong>recargar la página</strong>. ',
                            confirmButtonText: 'Entendido'
                        });
                    }
                }
            );
        }
    }

    showLocationInstructions() {
        let instructions = `
            <p class="mb-3">Esta aplicación en pruebas permite comunicar tus necesidades básicas a las autoridades que coordinan las labores de rescate. Tienes que estar físicamente en el sitio donde comunicas el problema, esto es así para evitar un uso no indebido de la aplicación.</p>
            
            <p class="mb-2">Tu ubicación ayuda a las autoridades a:</p>
            <ul class="text-left mb-4 custom-bullet-list">
                <li>Crear un mapa de necesidades en tiempo real</li>
                <li>Coordinar la ayuda de manera más eficiente</li>
                <li>Priorizar las zonas más afectadas</li>
                <li>Distribuir los recursos disponibles donde más se necesitan</li>
            </ul>
            
            <p class="mb-2">Para activar la ubicación:</p>
            <ol class="text-left mb-2 custom-number-list">
                <li>Haz clic en el icono de permisos en la barra de direcciones</li>
                <li>Busca la opción de "Ubicación" o "Location"</li>
                <li>Selecciona "Permitir" o "Allow"</li>
            </ol>`;
            //mostrar un link de la politica de privacidad en pagina nueva
            instructions += `<p class="mb-2 mt-3">Para más información, consulta nuestra <a href="/privacy-policy" target="_blank" class="privacy-link">política de privacidad</a>.</p>`;
    
        Swal.fire({
            icon: 'info',
            title: 'Ayúdanos a coordinar mejor la ayuda',
            html: instructions,
            showCancelButton: false,
            confirmButtonText: 'Intentar de nuevo',
            confirmButtonColor: '#2196F3',
            width: '600px'
        }).then((result) => {
            if (result.isConfirmed) {
                this.getCurrentLocation();
            }
        });
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
        console.log(this.locationDenied);
        if(this.locationDenied){
            await new Promise<void>((resolve) => {
                this.getCurrentLocation();
                // Esperamos un poco para dar tiempo a que se actualice la ubicación
                setTimeout(() => resolve(), 1000);
            });
            if(this.locationDenied) {
                Swal.fire({
                    icon: 'info',
                    title: 'Obteniendo ubicación',
                    html: 'Estamos obteniendo tu ubicación. Puede tardar hasta 30 segundos. Por favor, espera unos segundos y vuelve a intentarlo.' +
                         '<br><br>Si el problema persiste, te recomendamos probar con Google Chrome, o Microsoft Edge, ya que suele tener mejor compatibilidad con la geolocalización.',
                    confirmButtonText: 'Entendido'
                });
                /*Swal.fire({
                    icon: 'info',
                    title: 'Obteniendo ubicación',
                    text: 'Estamos obteniendo tu ubicación. Puede tardar hasta 30 segundos. Por favor, espera unos segundos y vuelve a intentarlo.',
                    confirmButtonText: 'Entendido'
                });*/
                return;
            }
            //this.getCurrentLocation();
            /*Swal.fire({
                icon: 'warning',
                text: 'Por favor, activa la ubicación para enviar tu solicitud',
                confirmButtonText: 'Entendido'
            });*/
            return;
        }
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
            otherNeeds: this.otherNeeds.trim(),
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
                text: 'Tu solicitud ha sido registrada correctamente. Las autoridades y organizaciones de ayuda tendrán esta información a su disposición. El tiempo de respuesta dependerá de los procesos de triaje y priorización de estas.',
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
}
