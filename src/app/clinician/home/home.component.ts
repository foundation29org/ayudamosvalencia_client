import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { RequestCliService } from 'app/shared/services/request-cli.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ToastrService } from 'ngx-toastr';
import { SearchService } from 'app/shared/services/search.service';
import { SortService } from 'app/shared/services/sort.service';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { DateService } from 'app/shared/services/date.service';
import { SearchFilterPipe } from 'app/shared/services/search-filter.service';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import Swal from 'sweetalert2';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [RequestCliService, Apif29BioService, ApiDx29ServerService]
})

export class HomeComponent implements OnInit, OnDestroy {
  //Variable Declaration
  patient: any;

  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  private group: string;
  loadingDataGroup: boolean = false;
  dataGroup: any;
  timeformat = "";
  lang = 'en';
  formatDate: any = [];
  today = new Date();

  userId: string = '';
  loadedPatientId: boolean = false;
  selectedPatient: any = {};
  userInfo: any = {};
  loadedInfoPatient: boolean = false;
  basicInfoPatient: any;
  basicInfoPatientCopy: any;
  age: number = null;
  weight: string;
  step: string = '1';
  private subscription: Subscription = new Subscription();

  actualLocation: any = {};
  @ViewChild('f') personalInfoForm: NgForm;
  sending: boolean = false;
  saving: boolean = false;

  // Google map lat-long
  lat: number = 50.431134;
  lng: number = 30.654701;
  zoom = 4;
  showMarker: boolean = false;
  resTextAnalyticsSegments: any;
  newDrugs: any = [];
  newDrug: any = {};
  callingTextAnalytics: boolean = false;

  requests: any = [];
  loadedRequest: boolean = false;
  showPanelEdit: boolean = false;
  actualRequest: any = {};
  requestIndex = -1;
  modalReference: NgbModalRef;
  editingDrugIndex: number = -1;
  checks: any = {};
  tasksLoaded: boolean = false;
  isWizard: boolean = false;
  mapClickListener: any;
  map: any;
  indexRequest= -1;
  countries: any = [];

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private requestCliService: RequestCliService, public searchFilterPipe: SearchFilterPipe, public toastr: ToastrService, private dateService: DateService, private apiDx29ServerService: ApiDx29ServerService, private sortService: SortService, private adapter: DateAdapter<any>, private searchService: SearchService, private router: Router, private apif29BioService: Apif29BioService, private modalService: NgbModal, private zone: NgZone) {
    this.adapter.setLocale(this.authService.getLang());
    this.lang = this.authService.getLang();
    switch (this.authService.getLang()) {
      case 'en':
        this.timeformat = "M/d/yy";
        break;
      case 'es':
        this.timeformat = "d/M/yy";
        break;
      case 'nl':
        this.timeformat = "d-M-yy";
        break;
      default:
        this.timeformat = "M/d/yy";
        break;

    }
    this.loadCountries();
  }

  loadCountries() {
    this.countries = [];
    //load countries file
    this.subscription.add(this.http.get('assets/jsons/phone_codes.json')
      .subscribe((res: any) => {
        //get country name
        for (let row of res) {
          var countryName = "";
          var countryNameList = [];
          countryNameList = row.name.split(/["]/g)
          countryName = countryNameList[1]

          var countryNombre = "";
          var countryNombreList = [];
          countryNombreList = row.nombre.split(/["]/g)
          countryNombre = countryNombreList[1]
          this.countries.push({ countryName: countryName, countryNombre: countryNombre })
        }
        if (this.lang == 'es') {
          this.countries.sort(this.sortService.GetSortOrder("countryNombre"));
        } else {
          this.countries.sort(this.sortService.GetSortOrder("countryName"));
        }
      }));

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.mapClickListener) {
      this.mapClickListener.remove();
    }
  }


  ngOnInit() {
    this.getUserInfo();
    this.initEnvironment();
    this.getRequestCli();
  }

  getRequestCli() {
    this.loadedRequest = false;
    this.subscription.add(this.requestCliService.getRequests()
      .subscribe((res: any) => {
        this.requests = res;
        if(this.requests.length == 0){
          this.newRequest()
          this.showPanelEdit = true;
        }else{
          this.showPanelEdit = false;
          this.requests.sort(this.sortService.DateSortInver("creationDate"));
          for (let i = 0; i < this.requests.length; i++) {
            if(this.requests[i].lat!=''){
              this.requests[i].lat = parseFloat(this.requests[i].lat)
              this.requests[i].lng = parseFloat(this.requests[i].lng)
              //this.showMarker = true;
            }else{
              //this.showMarker = false;
            }
            
  
          }
          this.getChecks();
        }
        
        this.indexRequest = -1;
        this.loadedRequest = true;
        
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
        this.showPanelEdit = false;
      }));
  }

  loadEnvironment() {
    this.group = this.authService.getGroup();
    this.patient = {
    };
    this.loadTranslations();
  }


  //traducir cosas
  loadTranslations() {
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk = res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail = res;
    });
  }

  initEnvironment() {
    this.userId = this.authService.getIdUser();
    this.loadEnvironment();
  }


  getUserInfo() {
    this.subscription.add(this.http.get(environment.api + '/api/users/name/' + this.authService.getIdUser())
      .subscribe((res: any) => {
        this.userInfo = res;
        if (this.userInfo.lat == "") {
        }
      }, (err) => {
        console.log(err);
      }));

  }

  deletelocation0(){
    this.actualRequest.lat = ''
    this.actualRequest.lng = ''
    //this.showMarker = false;
    /*if(this.requests.length>0){
      this.requests[0].lat = ''
      this.requests[0].lng = ''
    }*/
  }

  deletelocation1(index){
    this.requests[index].lat = ''
    this.requests[index].lng = ''
    //this.showMarker = false;
    this.actualRequest.lat = ''
    this.actualRequest.lng = ''
  }

  question0() {
    this.step = '2';
  }

  question1() {
    this.step = '3';
  }

  question2() {
    this.step = '4';
  }

  getLiteral(literal) {
    return this.translate.instant(literal);
  }


  submitInvalidForm() {
    if (!this.personalInfoForm) { return; }
    const base = this.personalInfoForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
        base.form.controls[field].markAsTouched()
      }
    }
  }

  setPatientGroup(group) {
    this.saving = true;
    this.basicInfoPatient.group = group;
    this.subscription.add(this.http.put(environment.api + '/api/patients/' + this.authService.getCurrentPatient().sub, this.basicInfoPatient)
      .subscribe((res: any) => {
        this.authService.setGroup(this.basicInfoPatient.group);
        this.saving = false;
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
      }, (err) => {
        console.log(err);
        this.saving = false;
      }));
  }

  goStep(index) {
    this.step = index;
  }

  onSelect(event) {
    //your code here
  }

  changePickupMarkerLocation($event: { coords: any }, index) {
    this.requests[index].lat = $event.coords.lat;
    this.requests[index].lng = $event.coords.lng;
    //this.showMarker = true;
  }

  changePickupMarkerLocation2($event: { coords: any }) {
    this.actualRequest.lat = $event.coords.lat;
    this.actualRequest.lng = $event.coords.lng;
    //this.showMarker = true;
  }

  mapReadyHandler(map: google.maps.Map): void {
    this.map = map;
    this.mapClickListener = this.map.addListener('click', (e: google.maps.MouseEvent) => {
      this.zone.run(() => {
        // Here we can get correct event
        this.actualRequest.lat = e.latLng.lat();
        this.actualRequest.lng = e.latLng.lng();
        //this.showMarker = true;
      });
    });
  }

  mapReadyHandler2(map: google.maps.Map, index): void {
    this.map = map;
    this.mapClickListener = this.map.addListener('click', (e: google.maps.MouseEvent) => {
      this.zone.run(() => {
        // Here we can get correct event
        this.requests[index].lat = e.latLng.lat();
        this.requests[index].lng = e.latLng.lng();
        //this.showMarker = true;
      });
    });
  }

  confirmDeleteDrug(index, isWizard, indexRequest) {
    if(isWizard){
      Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete") + ': ' + this.actualRequest.drugs[index].name,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#FF586B',
        confirmButtonText: this.translate.instant("generics.Delete"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          this.actualRequest.drugs.splice(index, 1);
          this.newDrugs = this.actualRequest.drugs;
        }
      });
    }else{
      Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete") + ': ' + this.requests[indexRequest].drugs[index].name,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#FF586B',
        confirmButtonText: this.translate.instant("generics.Delete"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          //var info = this.requests[indexRequest].drugs[index];
          var info = {drugs: this.requests[indexRequest].drugs, index: index};
          this.subscription.add(this.requestCliService.deletedrug(this.requests[indexRequest]._id, info)
          .subscribe((res: any) => {
            //console.log(res);
          }, (err) => {
            console.log(err);
          }));
          this.requests[indexRequest].drugs.splice(index, 1);
          this.newDrugs = this.requests[indexRequest].drugs;
        }
      });
    }
    
  }

  newRequest(){
    this.initRequest();
    this.showPanelEdit = true;
    this.lat = parseFloat(this.userInfo.lat)
    this.lng = parseFloat(this.userInfo.lng)
  }

  initRequest(){
    this.actualRequest={
      lat: '',
      lng: '',
      notes: '',
      needs: '',
      needAssistance: '',
      referralCenter: '',
      country: null,
      status: null,
      updateDate: Date.now(),
      group: null,
      othergroup: null,
      drugs: [],
      _id: null
    }
  }

  setRequest(){
    this.saving = true;
    this.updateRequest(this.actualRequest,0);
  }

  updateRequest(request, index){
    this.requestIndex = index;
    this.saving = true;
    this.changeRequest(request)
  }

  changeRequest(info){
    if(this.modalReference != undefined){
      this.modalReference.close()
    }
    if(info._id!=null){
      this.subscription.add(this.requestCliService.updateRequest(info._id, info)
      .subscribe((res: any) => {
        this.saving = false;
        this.step = '1';
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
        this.setUserPosition(info.lat, info.lng)
        this.getRequestCli();
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
      }));
    }else{
      this.subscription.add(this.requestCliService.saveRequest(info)
      .subscribe((res: any) => {
        this.saving = false;
        this.step = '1';
        this.setUserPosition(info.lat, info.lng)
        this.getRequestCli();
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
      }));
    }

  }

  setUserPosition(lat, lng){
    if(lat!=''){
      //this.showMarker = true;
      this.lat = parseFloat(lat)
      this.lng = parseFloat(lng)
      this.userInfo.lat = parseFloat(lat)
      this.userInfo.lng = parseFloat(lng)
      this.subscription.add(this.requestCliService.setPosition(this.userInfo.lat, this.userInfo.lng)
        .subscribe((res: any) => {
        }, (err) => {
          console.log(err);
        }));
    }else{
      //this.showMarker = false;
    }
    
  }

  confirmDeleteRequest(index) {
    Swal.fire({
      title: this.translate.instant("generics.Are you sure?"),
      html: this.translate.instant("generics.Delete"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0CC27E',
      cancelButtonColor: '#FF586B',
      confirmButtonText: this.translate.instant("generics.Delete"),
      cancelButtonText: this.translate.instant("generics.No, cancel"),
      showLoaderOnConfirm: true,
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        var _id = this.requests[index]._id;
        this.requests.splice(index, 1);
        this.deleteRequest(_id);
      }
    });
  }

  deleteRequest(_id){
    this.subscription.add(this.requestCliService.deleteRequest(_id)
      .subscribe((res: any) => {
        this.indexRequest = -1;
        this.getRequestCli();
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
      }));
  }

  addDrug(InfoDrug, isWizard, indexRequest){
    this.indexRequest = indexRequest;
    this.isWizard = isWizard;
    this.editingDrugIndex = -1;
    this.newDrug = {name: '', dose: '', link: '', strength: ''};
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      backdrop : 'static',
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(InfoDrug, ngbModalOptions);
  }

  editDrug(index, InfoDrug, isWizard, indexRequest){
    this.indexRequest = indexRequest;
    this.isWizard = isWizard;
    this.editingDrugIndex = index;
    if(isWizard){
      this.newDrug = this.actualRequest.drugs[index];
    }else{
      this.newDrug = this.requests[indexRequest].drugs[index];
    }
    
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      backdrop : 'static',
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(InfoDrug, ngbModalOptions);
  }

  saveNewDrug(){
    this.detectLang2(this.newDrug);
  }

  closePanel(){
    //this.users = JSON.parse(JSON.stringify(this.usersCopy));
    this.modalReference.close();
  }

  detectLang2(drug) {
    var testLangText = drug.name.substr(0, 4000)
    if(testLangText.length>0){
      this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
      .subscribe((res: any) => {
        if(res[0].language!='en'){
          var info = [{"Text":drug.name}]
          this.subscription.add(this.apif29BioService.getTranslationDictionary2(res[0].language, info)
                  .subscribe((res2: any) => {
                    var textToTA = drug.name.replace(/\n/g, " ");
                    if(res2[0]!=undefined){
                      if(res2[0].translations[0]!=undefined){
                        textToTA = res2[0].translations[0].text;
                      }
                    }
                    drug.name=textToTA;
                      this.callTextAnalitycs2(drug);
                  }, (err) => {
                      console.log(err);
                      this.callTextAnalitycs2(drug);
                  }));
        }else{
          this.callTextAnalitycs2(drug);
        }
        
      }, (err) => {
        console.log(err);
        this.toastr.error('', this.translate.instant("generics.error try again"));
        this.callTextAnalitycs2(drug);
      }));
    }else{
      this.callingTextAnalytics = false;
      if(this.editingDrugIndex>-1){
        if(this.isWizard){
          this.actualRequest.drugs[this.editingDrugIndex] = drug;
        }else{
          this.requests[this.indexRequest].drugs[this.editingDrugIndex] = drug;
        }
        
      }else{
        if(this.isWizard){
          this.actualRequest.drugs[this.editingDrugIndex] = drug;
          this.actualRequest.drugs.push(drug);
        }else{
          this.requests[this.indexRequest].drugs.push(drug);
        }
        
      }
      if(!this.isWizard){
        this.updateRequest(this.requests[this.indexRequest],0);
      }
      this.closePanel();
    }
    
  }

  callTextAnalitycs2(drug) {
    this.callingTextAnalytics = true;
    var info = drug.name.replace(/\n/g, " ");
    var jsontestLangText = { "text": info };
    this.subscription.add(this.apif29BioService.callTextAnalytics(jsontestLangText)
      .subscribe((res: any) => {
        this.resTextAnalyticsSegments = res;
        var foundDrug = false;
          for (let j = 0; j < this.resTextAnalyticsSegments.entities.length; j++) {
            var actualDrug = { name: '', dose: '', link: '', strength: '' };
            if (this.resTextAnalyticsSegments.entities[j].category == 'MedicationName') {
              actualDrug.name = this.resTextAnalyticsSegments.entities[j].text;
              
              if (this.resTextAnalyticsSegments.entities[j].dataSources != null) {
                var found = false;
                for (let k = 0; k < this.resTextAnalyticsSegments.entities[j].dataSources.length && !found; k++) {
                  if (this.resTextAnalyticsSegments.entities[j].dataSources[k].name == 'ATC') {
                    actualDrug.link = this.resTextAnalyticsSegments.entities[j].dataSources[k].entityId;
                    found = true;
                  }
                }
              }
              if (this.resTextAnalyticsSegments.entityRelations != null) {
                var found = false;
                for (let k = 0; k < this.resTextAnalyticsSegments.entityRelations.length && !found; k++) {
                  if(this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.text==actualDrug.name && this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.category=='MedicationName' && this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.category=='Dosage'){
                    actualDrug.dose = this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.text;
                  }
                  if(this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.text==actualDrug.name && this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.category=='Dosage' && this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.category=='MedicationName'){
                    actualDrug.dose = this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.text;
                  }
                }

              }
              drug.name= actualDrug.name;
              drug.link= actualDrug.link;
              if(this.editingDrugIndex>-1){
                if(this.isWizard){
                  this.actualRequest.drugs[this.editingDrugIndex] = drug;
                }else{
                  this.requests[this.indexRequest].drugs[this.editingDrugIndex] = drug;
                }
                
              }else{
                if(this.isWizard){
                  this.actualRequest.drugs.push(drug);
                }else{
                  this.requests[this.indexRequest].drugs.push(drug);
                }
                
              }
              foundDrug = true;
              if(!this.isWizard){
                this.updateRequest(this.requests[this.indexRequest],0);
              }
              
            }
          }
          if(!foundDrug){
            if(this.editingDrugIndex>-1){
              if(this.isWizard){
                this.actualRequest.drugs[this.editingDrugIndex] = drug;
                this.actualRequest.drugs[this.editingDrugIndex].link = "";
              }else{
                this.requests[this.indexRequest].drugs[this.editingDrugIndex] = drug;
                this.requests[this.indexRequest].drugs[this.editingDrugIndex].link = "";
              }
              
            }else{
              drug.link = "";
              if(this.isWizard){
                this.actualRequest.drugs.push(drug);
              }else{
                this.requests[this.indexRequest].drugs.push(drug);
              }
              
            }
            if(!this.isWizard){
              this.updateRequest(this.requests[this.indexRequest],0);
            }
            
          }
        this.callingTextAnalytics = false;
        this.closePanel();

      }, (err) => {
        console.log(err);
        this.callingTextAnalytics = false;
        this.closePanel();
      }));
  }

  getChecks(){
    this.subscription.add( this.http.get(environment.api+'/api/requestclin/checks/'+this.userId)
    .subscribe( (res : any) => {
      this.checks = res.checks;
      this.tasksLoaded = true;
     }, (err) => {
       console.log(err.error);
       this.tasksLoaded = true;
     }));
  }

  setChecks(){
    var paramssend = { checks: this.checks };
    this.subscription.add( this.http.put(environment.api+'/api/requestclin/checks/'+this.userId, paramssend)
    .subscribe( (res : any) => {
      
     }, (err) => {
       console.log(err.error);
     }));
  }

  setCheck1(bool){
    this.checks.check1 = bool;
    this.setChecks();
  }

  setCheck2(bool){
    this.checks.check2 = bool;
    this.setChecks();
  }

  openModal(SampleDrug){
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(SampleDrug, ngbModalOptions);
  }

  viewRequest(index){
    this.indexRequest = index;
  }

  back(){
    this.indexRequest = -1;
    this.showPanelEdit = false;
  }
}

export let lineChartSeries = [
];

export let barChart: any = [
];