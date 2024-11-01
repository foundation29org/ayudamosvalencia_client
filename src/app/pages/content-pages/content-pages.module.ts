import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';
import { ContentPagesRoutingModule } from "./content-pages-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { ErrorPageComponent } from "./error/error-page.component";
import { ForgotPasswordPageComponent } from "./forgot-password/forgot-password-page.component";
import { NewPasswordPageComponent } from "./new-password/new-password-page.component";
import { LoginPageComponent } from "./login/login-page.component";
import { RegisterPageComponent } from "./register/register-page.component";
import { TermsConditionsPageComponent } from "./terms-conditions/terms-conditions-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import {PasswordValidator} from "app/shared/directives/password-validator.directive"; //imported to modules
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MyFilterPipe } from 'app/shared/services/my-filter.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
@NgModule({
    exports: [
        TranslateModule,
        MatDatepickerModule,
        MatNativeDateModule 
    ],
    imports: [
        CommonModule,
        ContentPagesRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCheckboxModule,
        MatCardModule,
        MatRadioModule
    ],
    declarations: [
        ErrorPageComponent,
        ForgotPasswordPageComponent,
        LoginPageComponent,
        RegisterPageComponent,
        NewPasswordPageComponent,
        TermsConditionsPageComponent,
        PrivacyPolicyPageComponent,
        PasswordValidator,
        MyFilterPipe
    ],
    entryComponents:[TermsConditionsPageComponent]
})
export class ContentPagesModule { }
