import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { StaffService } from '../staff/staff.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  formulario! : FormGroup;

  submetido = false

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private httpClient: HttpClient,
    public staffService: StaffService
  ) { }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      nome: ['', [Validators.required]],
      cpf: ['', [Validators.required]],
      email: ['',[ Validators.required,  Validators.email]],
      senha: ['', [Validators.required, Validators.pattern('^(?=.*?[!@#$%¨&*])(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$')]]
    })
  }

  btnEntrar(){
    this.router.navigateByUrl("/login")
  }

  cadastrar():void {
    console.log(this.formulario.controls)
    this.submetido = true
    if (this.formulario.valid){
      const form = this.formulario.value

      const userObj = {
        username: form['email'],
        password: form['senha']
      }


      this.httpClient.post<any>(environment.urlApi + '/auth/register/', userObj)
      .toPromise()
      .then(response => {
        const personObj = {
          user_id: response['pk'],
          nome: form['nome'],
          contato_email: form['email'],
          saldo_atual: 0,
          cpf: form['cpf']
        }

        this.staffService.createPerson(personObj).subscribe({
          next: (res) => {
            console.log(res);
            this.router.navigate(["/login"])
          }
        })

      })
      .catch(async (error) => {
      });

    }
  }

}
