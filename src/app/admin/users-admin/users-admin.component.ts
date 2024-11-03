import { Component, ViewChild, OnDestroy } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import {DateAdapter} from '@angular/material/core';
import { json2csv } from 'json-2-csv';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-users-admin',
    templateUrl: './users-admin.component.html',
    styleUrls: ['./users-admin.component.scss']
})

export class UsersAdminComponent implements OnDestroy{
  @ViewChild('myTable') table: DatatableComponent;
  selectedRow: any = null;

  addedlang: boolean = false;
  lang: any;
  allLangs: any;
  langs: any;
  working: boolean = false;
  sending: boolean = false;
  loadingUsers: boolean = false;
  users: any = [];
  user: any = {};
  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();
  timeformat="";
  groupId: any;
  groupEmail: any;
  lat: number = 39.4699;
  lng: number = -0.3763;
  zoom = 7;
  rowIndex: number = -1;
  emailMsg="";
  msgList: any = {};
  needsList = [
    { id: 'electricity', label: 'Suministro de electricidad' },
    { id: 'water', label: 'Agua potable' },
    { id: 'sumwater', label: 'Suministro de agua' },
    { id: 'food', label: 'Alimentos' },
    { id: 'alojamiento', label: 'Alojamiento' },
    { id: 'ropa', label: 'Ropa' },
];

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, public toastr: ToastrService, private modalService: NgbModal, private dateService: DateService,private adapter: DateAdapter<any>){

    this.adapter.setLocale(this.authService.getLang());
    this.lang = this.authService.getLang()
    switch(this.authService.getLang()){
      case 'en':
        this.timeformat="M/d/yy";
        break;
      case 'es':
          this.timeformat="d/M/yy";
          break;
      case 'nl':
          this.timeformat="d-M-yy";
          break;
      default:
          this.timeformat="M/d/yy";
          break;

    }  
    this.getRequests();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getRequests(){
    this.loadingUsers = true;
    this.subscription.add( this.http.get(environment.api+'/api/needs/complete')
    .subscribe( (response : any) => {
      if(response.success) {
        const requests = response.data;
        for(let request of requests){
          request.lat = request.location.lat;
          request.lng = request.location.lng;
          request.formattedDate = this.dateService.transformDate(new Date(request.timestamp));
          
          // Mapear los IDs a sus etiquetas
          request.formattedNeeds = request.needs.map(needId => 
            this.needsList.find(need => need.id === needId)?.label || needId
          ).join(', ');
          
          if(request.otherNeeds) {
            request.formattedNeeds += request.formattedNeeds ? `, ${request.otherNeeds}` : request.otherNeeds;
          }
        }
        this.users = requests.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
      this.loadingUsers = false;      
    }, (err) => {
      console.log(err);
      this.loadingUsers = false;
    }));
  }

  viewOnMap(row: any) {
    // Centrar el mapa en la ubicación seleccionada
    this.lat = row.lat;
    this.lng = row.lng;
    this.zoom = 16; // Zoom más cercano para ver mejor la ubicación

    // Opcional: resaltar el marcador seleccionado
    this.users = this.users.map(user => ({
      ...user,
      icon: user._id === row._id ? 'assets/images/marker-highlighted.png' : undefined
    }));

    // Scroll suave hasta el mapa
    const mapElement = document.querySelector('agm-map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }

    // Mostrar un popup con los detalles
    Swal.fire({
      title: 'Detalles de la necesidad',
      html: `
        <p><strong>Fecha:</strong> ${row.formattedDate}</p>
        <p><strong>Necesidades:</strong> ${row.formattedNeeds}</p>
        <p><strong>Ubicación:</strong> ${row.lat}, ${row.lng}</p>
      `,
      icon: 'info'
    });
  }


  deleteNeed(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${environment.api}/api/needs/${id}`).subscribe(
          (response: any) => {
            if (response.success) {
              Swal.fire(
                'Eliminado',
                'La necesidad ha sido eliminada',
                'success'
              );
              this.getRequests(); // Recargar la lista
            } else {
              Swal.fire(
                'Error',
                'No se pudo eliminar la necesidad',
                'error'
              );
            }
          },
          (error) => {
            console.error('Error:', error);
            Swal.fire(
              'Error',
              'Ocurrió un error al eliminar la necesidad',
              'error'
            );
          }
        );
      }
    });
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  fieldStatusChanged(row: any) {
    const status = row.status;
    const statusInfo = this.translate.instant(`needs.status.${status}`);
    
    const data = { 
      status: status,
      statusInfo: statusInfo
    };

    this.subscription.add(
      this.http.put(`${environment.api}/api/needs/status/${row._id}`, data)
        .subscribe(
          (res: any) => {
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
          },
          (err) => {
            console.log(err);
            this.toastr.error('', this.translate.instant("generics.Error saving data"));
          }
        )
    );
  }


  onSubmitExportData(){
    var tempRes = JSON.parse(JSON.stringify(this.users));
    for(var j=0;j<tempRes.length;j++){
      delete tempRes[j].icon;
    }
    this.createFile(tempRes);
  }

  createFile(res){
    let json2csvCallback = function (err, csv) {
      if (err) throw err;
      var blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    var url  = URL.createObjectURL(blob);
    var p = document.createElement('p');
    document.getElementById('content').appendChild(p);

    var a = document.createElement('a');
    var dateNow = new Date();
    var stringDateNow = this.dateService.transformDate(dateNow);
    a.download    = "AyudamosValencia_"+stringDateNow+".csv";
    a.href        = url;
    a.textContent = "AyudamosValencia_"+stringDateNow+".csv";
    a.setAttribute("id", "download")

    document.getElementById('content').appendChild(a);
    document.getElementById("download").click();
  }.bind(this);

  var options ={'expandArrayObjects' :true, "delimiter": { 'field': ';' }, excelBOM: true}
  json2csv(res, json2csvCallback, options);

  }

  onMarkerClick(request: any) {
    console.log('Marker clicked:', request); // Para verificar que se llama
    this.selectedRow = request;
    
    // Encontrar el índice de la fila
    const rowIndex = this.users.findIndex(user => user === request);
    
    if (rowIndex >= 0) {
        // Calcular la página donde está la fila
        const pageSize = this.table.pageSize || 10;
        const pageNumber = Math.floor(rowIndex / pageSize);
        this.table.offset = pageNumber;
        
        // Esperar a que se actualice la vista
        setTimeout(() => {
            // Buscar la fila por su índice
            const rows = document.querySelectorAll('.datatable-row-wrapper');
            const targetRow = rows[rowIndex % pageSize];
            
            if (targetRow) {
                //targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRow.classList.add('flash-highlight');
                setTimeout(() => targetRow.classList.remove('flash-highlight'), 1000);
            }
        }, 100);
    }
  }

getRowClass = (row: any) => {
  return {
    'selected-row': this.selectedRow === row
  };
}

}
