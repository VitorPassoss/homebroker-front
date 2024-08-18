import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './core/main/main.component';
import { LoginComponent } from './pages/login/login.component';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { StaffComponent } from './pages/staff/staff.component';
import { StaffDetailComponent } from './pages/staff/staff-detail/staff-detail.component';
import { HomebrokerComponent } from './pages/homebroker/homebroker.component';
import { RegisterComponent } from './pages/register/register.component';
import { SaidasHomeComponent } from './pages/saidas/saidas-home/saidas-home.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [JwtAuthGuard],
    component: MainComponent,
    children: [
      { path: 'staff', component: StaffComponent },
      { path: 'homebroker', component: HomebrokerComponent },
      { path: 'homebroker/details/:id', component: StaffDetailComponent },
      { path: 'pagamento', component: SaidasHomeComponent },
      { path: '', redirectTo: 'homebroker', pathMatch: 'full' }
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },
  { path: '**', redirectTo: 'login' }  // Optional: Catch-all route for unknown paths
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
