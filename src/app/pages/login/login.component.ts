import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SharedService } from 'src/app/shared/shared.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {


  formLogar! : FormGroup;
  mensagemErro = "";
  submetido = false;

  ngOnInit(): void {}

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private formBuilder: FormBuilder,
    private sharedService: SharedService

  ){
    this.formLogar = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  btnInscrever(){
    this.router.navigate(["/cadastro"])
  }

  logar() {
    this.submetido = true

      const formData = this.formLogar.value;
      this.httpClient.post<any>(environment.urlApi + '/auth/login/', formData)
        .toPromise()
        .then(async (response) => {
            this.router.navigate([''])

           localStorage.setItem('access_token', response.access_token);
    
        })
        .catch(async (error) => {
          this.mensagemErro = 'Senha ou E-mail invalidos.'
        });
    
  }



}
