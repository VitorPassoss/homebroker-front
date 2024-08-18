import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { StaffService } from '../pages/staff/staff.service';

@Injectable({
  providedIn: 'root'
})
export class JwtAuthGuard implements CanActivate {

  constructor(private router: Router, public svc: StaffService) { }

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    

    var jwtDecoded:any = jwtDecode(token!);


    var userId = jwtDecoded?.user_id

    console.log(jwtDecoded)

    this.svc.getPerson(userId).subscribe({
      next:(res)=>{
          localStorage.setItem('person', JSON.stringify(res[0]))
      }
    })
    



    if (token) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}