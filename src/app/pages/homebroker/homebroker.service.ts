import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class HomebrokerService {

  constructor(
    private http: HttpClient
  ) { }


  getEmpresas() {
    return this.http.get<any>(`${environment.urlApi}/staff/empresas`)
  }
  

  getFlow(id:any) {
    return this.http.get<any>(`${environment.urlApi}/staff/fechamentos/`+id)
  }


  processBuy(body:any) {
    return this.http.post<any>(`${environment.urlApi}/staff/wallet`, body )

  }



 





}
