import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TableModule } from 'primeng/table';
import { HttpClientModule } from '@angular/common/http';
import { SaidasModule } from './pages/saidas/saidas.module';
import { LoginComponent } from './pages/login/login.component';
import { BlockLoadingComponent } from './shared/block-loading/block-loading.component';
import { ToastModule } from 'primeng/toast';
import { StaffComponent } from './pages/staff/staff.component';
import { StaffDetailComponent } from './pages/staff/staff-detail/staff-detail.component';
import { SplitButtonModule } from 'primeng/splitbutton';
import { SpeedDialModule } from 'primeng/speeddial';
import { HomebrokerComponent } from './pages/homebroker/homebroker.component';
import { NgApexchartsModule } from "ng-apexcharts";
import { RegisterComponent } from './pages/register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    StaffComponent,
    StaffDetailComponent,
    HomebrokerComponent,
    RegisterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    BrowserAnimationsModule,
    TableModule,
    HttpClientModule,
    SaidasModule,
    BlockLoadingComponent,
    ToastModule,
    SplitButtonModule,
    SpeedDialModule,
    NgApexchartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
