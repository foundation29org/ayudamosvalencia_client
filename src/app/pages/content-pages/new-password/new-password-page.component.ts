import { Component, ViewChild, OnDestroy, OnInit, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { sha512 } from "js-sha512";
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-new-password-page',
    templateUrl: './new-password-page.component.html',
    styleUrls: ['./new-password-page.component.scss']
})

export class NewPasswordPageComponent implements OnDestroy, OnInit{
    @ViewChild('f') newPasswordForm: NgForm;
    sending: boolean = false;
    showlink:boolean = false;
    changed: boolean = false;
    private subscription: Subscription = new Subscription();
    @ViewChild('recaptcha') recaptchaElement: ElementRef;
    captchaToken: string = "";
    needCaptcha: boolean = true;

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService) { }

    ngOnInit() {
      this.addRecaptchaScript();
    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    renderReCaptch() {
      this.needCaptcha = true;
      if(this.recaptchaElement==undefined){
        location.reload();
      }else{
        try{  
        window['grecaptcha'].render(this.recaptchaElement.nativeElement, {
          'sitekey' : environment.captcha,
          'callback': (response) => {
            this.captchaToken = response;
            console.log(response);
            this.needCaptcha = false;
  
          }
        });
        }catch(e){
          console.log(e);
          window['grecaptcha'].reset();
        }
      }
  
    }
  
    addRecaptchaScript() {
  
      window['grecaptchaCallback'] = () => {
        this.renderReCaptch();
      }
  
      (function(d, s, id, obj){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) { obj.renderReCaptch(); return;}
        js = d.createElement(s); js.id = id;
        js.src = "https://www.google.com/recaptcha/api.js?onload=grecaptchaCallback&amp;render=explicit";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'recaptcha-jssdk', this));
  
    }
    

    submitInvalidForm() {
      if (!this.newPasswordForm) { return; }
      const base = this.newPasswordForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched();
        }
      }
    }

    // On submit click, reset form fields
    onSubmit() {
      this.sending = true;
      this.showlink = false;
      //var param = router.parseUrl(router.url).queryParams["email","key"];
      var param = this.router.parseUrl(this.router.url).queryParams;
      if(param.email && param.key){
        this.newPasswordForm.value.password=sha512(this.newPasswordForm.value.password);
        var paramssend = { email: param.email, password: this.newPasswordForm.value.password, randomCodeRecoverPass: param.key, captchaToken: this.captchaToken};

        this.subscription.add( this.http.post(environment.api+'/api/updatepass',paramssend)
        .subscribe( (res : any) => {
          console.log(res);
          this.sending = false;
          this.newPasswordForm.reset();
          if (res.message == 'Token is empty or invalid' || res.message == 'recaptcha failed') {
            this.needCaptcha = true;
            Swal.fire(this.translate.instant("generics.Warning"), res.message, "warning");
            this.addRecaptchaScript();
          }else{
            Swal.fire('', this.translate.instant("recoverpass.Password changed"), "success");
            this.changed = true;
          }
         
         }, (err) => {
           //errores de fallos
           var errormsg=err.error.message;
           console.log(errormsg);
           if(errormsg == 'invalid link'){
             Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("recoverpass.invalidLink"), "warning");
           }else if(errormsg == 'link expired'){
             Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("recoverpass.expiredLink"), "warning");
             this.showlink = true;
           }else{
             Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
           }
           this.needCaptcha = true;
           this.addRecaptchaScript();
           this.sending = false;
           this.newPasswordForm.reset();
         }));

      }
    }

    // On Forgot password link click
    onForgotPassword() {
        this.router.navigate(['/forgotpassword']);
    }

    // On login link click
    onLogin() {
        this.router.navigate(['/login']);
    }

    // On registration link click
    onRegister() {
        this.router.navigate(['/register']);
    }
}
