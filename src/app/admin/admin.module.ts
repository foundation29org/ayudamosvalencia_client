import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from "./admin-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from "../shared/directives/match-height.directive";
import { UiSwitchModule } from 'ngx-ui-switch';
import { AgmCoreModule } from '@agm/core';

import { UsersAdminComponent } from "./users-admin/users-admin.component";
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {AutosizeModule} from 'ngx-autosize';
import { SafePipe } from '../shared/services/safe.pipe';
import { MapaPageComponent2 } from './mapa/mapa.component';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
    imports: [
        CommonModule,
        AdminRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        FormsModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        UiSwitchModule,
        AgmCoreModule.forRoot({
            apiKey: "AIzaSyAcbDF_C9btRGAUWSePhOR4UxsVbtK3cJA",
            language: sessionStorage && sessionStorage.getItem('lang') || 'es'
          }),
        NgxDatatableModule,
        AutosizeModule,
        MatCardModule,
        MatRadioModule
    ],
    exports: [TranslateModule],
    declarations: [
        UsersAdminComponent,
        SafePipe,
        MapaPageComponent2
    ],
    providers: [],
})
export class AdminModule { }
