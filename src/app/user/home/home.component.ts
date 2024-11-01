import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { PatientService } from 'app/shared/services/patient.service';
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
import * as chartsData from 'app/shared/configs/general-charts.config';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [PatientService, Apif29BioService, ApiDx29ServerService]
})

export class HomeComponent implements OnInit, OnDestroy {
  //Variable Declaration
  patient: any;
  selectedHeight: any;
  actualHeight: any;
  settingHeight: boolean = false;
  footHeight: any;

  //Chart Data
  lineChartSeizures = [];
  lineChartHeight = [];
  lineChartDrugs = [];
  lineChartDrugsCopy = [];
  lineDrugsVsSeizures = [];
  //Line Charts

  lineChartView: any[] = chartsData.lineChartView;

  // options
  lineChartShowXAxis = chartsData.lineChartShowXAxis;
  lineChartShowYAxis = chartsData.lineChartShowYAxis;
  lineChartGradient = chartsData.lineChartGradient;
  lineChartShowLegend = chartsData.lineChartShowLegend;
  lineChartShowXAxisLabel = chartsData.lineChartShowXAxisLabel;
  lineChartShowYAxisLabel = chartsData.lineChartShowYAxisLabel;

  lineChartColorScheme = chartsData.lineChartColorScheme;
  lineChartOneColorScheme = chartsData.lineChartOneColorScheme;

  // line, area
  lineChartAutoScale = chartsData.lineChartAutoScale;
  lineChartLineInterpolation = chartsData.lineChartLineInterpolation;


  //Bar Charts
  barChartView: any[] = chartsData.barChartView;

  // options
  barChartShowYAxis = chartsData.barChartShowYAxis;
  barChartShowXAxis = chartsData.barChartShowXAxis;
  barChartGradient = chartsData.barChartGradient;
  barChartShowLegend = chartsData.barChartShowLegend;
  barChartShowXAxisLabel = chartsData.barChartShowXAxisLabel;
  barChartXAxisLabel = chartsData.barChartXAxisLabel;
  barChartShowYAxisLabel = chartsData.barChartShowYAxisLabel;
  barChartYAxisLabel = chartsData.barChartYAxisLabel;
  barChartColorScheme = chartsData.barChartColorScheme;

  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  private msgDate: string;
  private group: string;
  actualMedications: any;
  loadedFeels: boolean = false;
  loadedEvents: boolean = false;
  loadedDrugs: boolean = false;
  loadingDataGroup: boolean = false;
  dataGroup: any;
  drugsLang: any;
  feels: any = [];
  events: any = [];
  medications: any = [];
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
  rangeDate: string = 'month';
  normalized: boolean = true;
  normalized2: boolean = true;
  maxValue: number = 0;
  maxValueDrugsVsSeizu: number = 0;
  minDate = new Date();
  minDateRange = new Date();
  drugsBefore: boolean = false;
  yAxisTicksSeizures = [];
  yAxisTicksDrugs = [];

  pendingsTaks: number = 8;
  totalTaks: number = 0;
  tasksLoaded: boolean = false;


  //lastchart
  showXAxis = false;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  legendTitle = 'Legend';
  legendPosition = 'right';
  showXAxisLabel = false;
  xAxisLabel = 'Country';
  showYAxisLabel = true;
  yAxisLabel = 'Seizures';
  showGridLines = true;
  animations: boolean = true;
  barChart: any[] = barChart;
  lineChartSeries: any[] = lineChartSeries;
  lineChartScheme = {
    name: 'coolthree',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b', '#7aa3e5', '#a8385d', '#00bfa5']
  };

  comboBarScheme = {
    name: 'singleLightBlue',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };

  showRightYAxisLabel: boolean = true;
  valueprogressbar = 0;
  recommendedDoses: any = [];
  showNotiSeizu: boolean = false;
  showNotiFeel: boolean = false;
  showNotiDrugs: boolean = false;

  countries: any = [];
  actualLocation: any = {};
  sending: boolean = false;
  saving: boolean = false;

  // Google map lat-long
  lat: number = 39.46975;
  lng: number = -0.37739;
  zoom = 7;
  showMarker: boolean = false;
  resTextAnalyticsSegments:any;
  newDrugs: any = [];
  newDrug: any = {};
  callingTextAnalytics: boolean = false;
  modalReference: NgbModalRef;
  editingDrugIndex: number = -1;
  checks: any = {};
  mapClickListener: any;
  map: any;

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private patientService: PatientService, public searchFilterPipe: SearchFilterPipe, public toastr: ToastrService, private dateService: DateService, private apiDx29ServerService: ApiDx29ServerService, private sortService: SortService, private adapter: DateAdapter<any>, private searchService: SearchService, private router: Router, private apif29BioService: Apif29BioService, private modalService: NgbModal, private zone: NgZone) {
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
  }

  loadEnvironment() {
    this.medications = [];
    this.actualMedications = [];
    this.group = this.authService.getGroup();
    this.patient = {
    };

    this.selectedHeight = {
      value: null,
      dateTime: null,
      technique: null,
      _id: null
    };

    this.footHeight = {
      feet: null,
      inches: null
    };

    this.actualHeight = {
      value: null,
      dateTime: null,
      technique: null,
      _id: null
    };

    this.loadTranslations();
    this.adapter.setLocale(this.authService.getLang());
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
    this.getInfoPatient();
    this.getChecks();
  }


  yAxisTickFormatting(value) {
    return this.percentTickFormatting(value);
  }

  percentTickFormatting(val: any) {
    return Math.round(val);
  }

  axisFormat(val) {
    if (Number.isInteger(val)) {
      return Math.round(val);
    } else {
      return '';
    }

  }

  //traducir cosas
  loadTranslations() {
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk = res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail = res;
    });
    this.translate.get('generics.Date').subscribe((res: string) => {
      this.msgDate = res;
    });
  }

  initEnvironment() {
    //this.userId = this.authService.getIdUser();
    if (this.authService.getCurrentPatient() == null) {
      this.loadPatientId();
    } else {
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.loadEnvironment();
    }
  }


  loadPatientId() {
    this.loadedPatientId = false;
    this.subscription.add(this.patientService.getPatientId()
      .subscribe((res: any) => {
        if (res == null) {
          this.authService.logout();
        } else {
          this.loadedPatientId = true;
          this.authService.setCurrentPatient(res);
          this.selectedPatient = res;
          this.loadEnvironment();
        }
      }, (err) => {
        console.log(err);
      }));
  }

  getUserInfo() {
    this.subscription.add(this.http.get(environment.api + '/api/users/name/' + this.authService.getIdUser())
      .subscribe((res: any) => {
        this.userInfo = res;
      }, (err) => {
        console.log(err);
      }));

  }

  getInfoPatient() {
    this.loadedInfoPatient = false;
    this.subscription.add(this.http.get(environment.api + '/api/patients/' + this.authService.getCurrentPatient().sub)
      .subscribe((res: any) => {
        this.basicInfoPatient = res.patient;
        this.basicInfoPatientCopy = JSON.parse(JSON.stringify(res.patient));
        this.loadedInfoPatient = true;
        if(this.basicInfoPatient.lat!=''){
          this.lat = parseFloat(this.basicInfoPatient.lat)
          this.lng = parseFloat(this.basicInfoPatient.lng)
          this.showMarker = true;
        }
        
      }, (err) => {
        console.log(err);
        this.loadedInfoPatient = true;
        this.toastr.error('', this.translate.instant("generics.error try again"));
      }));
  }

  deletelocation(){
    this.basicInfoPatient.lat = ''
    this.basicInfoPatient.lng = ''
    this.showMarker = false;
  }

  ageFromDateOfBirthday(dateOfBirth: any) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }

  question1() {
    this.step = '1';
  }

  question3() {
    //this.loadCountries();
    this.step = '3';
    if(this.basicInfoPatient.lat==""){
    }else{
      this.lat = parseFloat(this.basicInfoPatient.lat)
      this.lng = parseFloat(this.basicInfoPatient.lng)
      this.showMarker = true;
    }
  }

  setNeeds() {
    this.saving = true;
    this.basicInfoPatient.group = this.group;
    this.setPatientGroup(this.basicInfoPatient.group);
    this.goStep('1');
  }

  setNeeds2() {
    this.saving = true;
    //this.basicInfoPatient.drugs = this.newDrugs;
    this.setPatientGroup(this.basicInfoPatient.group);
    this.goStep('1');
  }

  getLiteral(literal) {
    return this.translate.instant(literal);
  }

  onSubmit() {
    this.sending = true;
      this.subscription.add(this.http.put(environment.api + '/api/patients/' + this.authService.getCurrentPatient().sub, this.basicInfoPatient)
        .subscribe((res: any) => {
          this.sending = false;
          this.goStep('5');
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.sending = false;
        }));


  }

  setPatientGroup(group) {
    this.saving = true;
    this.basicInfoPatient.group = group;
    this.subscription.add(this.http.put(environment.api + '/api/patients/' + this.authService.getCurrentPatient().sub, this.basicInfoPatient)
      .subscribe((res: any) => {
        this.authService.setGroup(this.basicInfoPatient.group);
        this.saving = false;
        if(this.basicInfoPatient.lat==""){
        }else{
          this.lat = parseFloat(this.basicInfoPatient.lat)
          this.lng = parseFloat(this.basicInfoPatient.lng)
          this.showMarker = true;
        }
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
      }, (err) => {
        console.log(err);
        this.saving = false;
      }));
  }

  goStep(index) {
    this.step = index;
  }

  changePickupMarkerLocation($event: { coords: any }) {
    this.basicInfoPatient.lat = $event.coords.lat;
    this.basicInfoPatient.lng = $event.coords.lng;
    this.showMarker = true;
  }

  mapReadyHandler(map: google.maps.Map): void {
    this.map = map;
    this.mapClickListener = this.map.addListener('click', (e: google.maps.MouseEvent) => {
      this.zone.run(() => {
        // Here we can get correct event
        this.basicInfoPatient.lat = e.latLng.lat();
        this.basicInfoPatient.lng = e.latLng.lng();
        this.showMarker = true;
      });
    });
  }

  changedCaretaker(event) {
    this.userInfo.iscaregiver = event.value;
    this.setCaretaker();
  }

  setCaretaker(){
    var data = {iscaregiver: this.userInfo.iscaregiver};
    this.subscription.add( this.http.put(environment.api+'/api/users/changeiscaregiver/'+this.authService.getIdUser(), data)
    .subscribe( (res : any) => {
     }, (err) => {
       console.log(err);
     }));
    //this.user = user;
  }

  confirmDeleteDrug(index){
    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ this.basicInfoPatient.drugs[index].name,
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
        var info = {drugs: this.basicInfoPatient.drugs, index: index};
      this.subscription.add( this.http.post(environment.api+'/api/patient/deletedrug/'+this.authService.getCurrentPatient().sub, info)
        .subscribe( (res : any) => {
          this.basicInfoPatient.drugs.splice(index, 1);
          this.newDrugs = this.basicInfoPatient.drugs;
        }, (err) => {
          console.log(err);
        }));

      }
    });
  }

  addDrug(InfoDrug){
    this.editingDrugIndex = -1;
    this.newDrug = {name: '', dose: '', link: '', strength: ''};
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      backdrop : 'static',
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(InfoDrug, ngbModalOptions);
  }

  editDrug(index, InfoDrug){
    this.editingDrugIndex = index;
    this.newDrug = this.basicInfoPatient.drugs[index];
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      backdrop : 'static',
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(InfoDrug, ngbModalOptions);
  }

  closePanel(){
    //this.users = JSON.parse(JSON.stringify(this.usersCopy));
    this.modalReference.close();
  }

  getChecks(){
    this.subscription.add( this.http.get(environment.api+'/api/patient/checks/'+this.authService.getCurrentPatient().sub)
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
    this.subscription.add( this.http.put(environment.api+'/api/patient/checks/'+this.authService.getCurrentPatient().sub, paramssend)
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

}

export let lineChartSeries = [
];

export let barChart: any = [
];