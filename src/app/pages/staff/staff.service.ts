import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class StaffService {

  constructor(
    private http: HttpClient
  ) { }


  getStaffs() {
      return this.http.get<any>(`${environment.urlApi}/staff/control`)
  }

  getEmpresas() {
    return this.http.get<any>(`${environment.urlApi}/staff/empresas`)
  }

  getTurnos() {
    return this.http.get<any>(`${environment.urlApi}/staff/turnos`)
  }

  getStatus() {
    return this.http.get<any>(`${environment.urlApi}/staff/status`)
  }
  getCargos() {
    return this.http.get<any>(`${environment.urlApi}/staff/cargos`)
  }

  saveStaffs(body:any) {
    return this.http.post<any>(`${environment.urlApi}/staff/control`, body)
    }

    updtStaffs(id:any,body:any) {
      return this.http.put<any>(`${environment.urlApi}/staff/control/`+id, body)
      }

    deleteStaffs(id:any) {
        return this.http.delete<any>(`${environment.urlApi}/staff/control/${id}`)
    }


    getDetail(id:any) {
      return this.http.get<any>(`${environment.urlApi}/staff/control/${id}`)
  }

  search(body:any){
    return this.http.post<any>(`${environment.urlApi}/staff/search`, body)

  }
  
  getWalletByID(id:any){
    return this.http.get<any>(`${environment.urlApi}/staff/wallet/${id}`)

  }

  createPerson(body:any){
    return this.http.post<any>(`${environment.urlApi}/staff/person`, body)

  }

  getPerson(id:any){
    return this.http.get<any>(`${environment.urlApi}/staff/person/${id}`)

  }


}
