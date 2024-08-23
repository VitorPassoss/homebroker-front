import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip
} from "ng-apexcharts";
import { Subject, interval } from 'rxjs';
import { takeUntil, map} from 'rxjs/operators';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { SharedService } from 'src/app/shared/shared.service';
import { StaffService } from '../staff/staff.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HomebrokerService } from './homebroker.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-homebroker',
  templateUrl: './homebroker.component.html',
  styleUrls: ['./homebroker.component.scss']
})
export class HomebrokerComponent implements OnInit, OnDestroy {
  public series!: any;
  public chart!: ApexChart;
  public dataLabels!: ApexDataLabels;
  public markers!: ApexMarkers;
  public title!: ApexTitleSubtitle;
  public fill!: ApexFill;
  public yaxis!: ApexYAxis;
  public xaxis!: ApexXAxis;
  public tooltip!: ApexTooltip;

  private destroy$ = new Subject<void>();
  public initialValue = 0;
  public currentValue = this.initialValue;
  public variation = 0;
  public valorFinal = 0;

  empresas: any[] = [];
  empresa: any = null;
  empresaObj: any = null;
  closeds: any = [];
  currentClosed: any = null;
  lastDay: any = null;
  visible: boolean = false;
  buyForm: FormGroup;
  buyValue: any = 0;
  pregaoBool: boolean = true;
  loading: boolean = false;
  private updateSubscription!: any;

  constructor(
    public sharedService: SharedService,
    public loadingService: LoadingService,
    public staffService: StaffService,
    public homeBrokerS: HomebrokerService,
    public routerService: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.buyForm = this.formBuilder.group({
      person: [null],
      quantidade: [null],
      empresa: [null],
      valor_compra: [null],
      valor_acao: [0]
    });
  }

  ngOnInit(): void {
    this.getEmpresas();
  }

  getEmpresas() {
    this.staffService.getEmpresas().subscribe({
      next: async (res) => {
        this.empresas = await res;
        this.setupInitial();
      }
    });
  }

  setupInitial() {
    const empresaId = Number(this.empresas[0].id);
    this.empresa = empresaId;

    this.empresaObj = this.empresas.find(empresa => empresa.id === empresaId);

    this.homeBrokerS.getFlow(empresaId).subscribe({
      next: async (res) => {
        this.closeds = res;
        this.lastDay = this.getLastDay(res);
        this.currentClosed = this.getClosedDay(res);
        this.setupParams();
        this.initChartData();
        // this.addInitialData();
        this.startRealTimeUpdates();
      }
    });
  }

  setupParams(): void {
    if (this.currentClosed && this.lastDay) {
      this.initialValue = parseFloat(this.lastDay.valor_final);
      this.valorFinal = parseFloat(this.currentClosed.valor_final);
      this.variation = parseFloat(this.currentClosed.variação);
      this.currentValue = this.initialValue;
    }
  }

  private addInitialData(): void {
    const now = new Date();
    const timezoneOffset = -2 ; // Offset de Brasília em minutos (UTC-3)
    this.currentValue = this.initialValue;

    
  
    for (let i = 0; i < 10; i++) {
      const localTime = new Date(now.getTime() - (10 - i) * 1000); // Tempo atual menos o intervalo
      const localTimeWithOffset = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000); // Ajusta para UTC
      const brTime = new Date(localTimeWithOffset.getTime()); // Ajusta para o horário de Brasília
  
      this.currentValue += this.currentValue * ((Math.random() - 0.5) * (2 * this.variation));
      
      this.series[0].data.push({
        x: new Date(localTime.getTime()),
        y: this.currentValue
      });
    }
    
    this.cdr.detectChanges();
  }
  

  startRealTimeUpdates(): void {
    this.updateSubscription = interval(1000).pipe(
      takeUntil(this.destroy$),
      map(() => {
        const now = new Date();
        const utcTime = new Date(now.getTime());
        const brTime = new Date(utcTime.getTime() - 3 * 60 * 60000); // UTC-3
  
        this.currentValue = parseFloat((this.currentValue + this.variation).toFixed(2));


        console.log(this.currentValue)

        this.series[0].data.push({
          x: now.getTime(),
          y: this.currentValue
        });
  
        if (this.series[0].data.length > 10) {
          this.series[0].data.shift(); 
        }
  

        console.log(this.series[0].data)

        this.cdr.detectChanges(); // Forçar detecção de mudanças após adicionar novos dados
      })
    ).subscribe();
  }
  
  buyAct() {
    this.visible = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  verifyBuyValue() {
    const formattedValue = parseFloat(this.currentValue.toFixed(2));
    const quantidade = this.buyForm.value['quantidade'];
    const valor_compra = formattedValue * quantidade;
    this.buyValue = valor_compra;
  }

  setEmpresa(event: any): void {
    this.empresa = event.value;
    this.empresaObj = this.empresas.find(empresa => empresa.id === this.empresa);

    this.homeBrokerS.getFlow(event.value).subscribe({
      next: async (res) => {
        this.closeds = res;
        this.currentClosed = this.getClosedDay(res);
        this.setupParams();
        this.initChartData();
      }
    });
  }

  private initChartData(): void {
    if (!this.empresaObj) {
      console.error('empresaObj não está definido.');
      return;
    }

    this.series = [
      {
        name: this.empresaObj.nome, // Assumindo que empresaObj é um objeto
        type: 'area',
        data: []
      },

    ];

    this.chart = {
      foreColor: '#fff',
      type: "area",
      stacked: false,
      height: 350,
      zoom: {
        type: "x",
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: "zoom"
      },
      
      
    };

 

    this.markers = {
      size: 0
    };

    this.title = {
      text: 'Variação do dia',
      align: "left"
    };

    this.fill = {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      }
    };

    this.yaxis = {
      labels: {
        formatter: (val) => val.toFixed(2)
      },
      title: {
        text: "Preço"
      }
    };

    this.xaxis = {
      type: "datetime",
      title: {
        text: "Hora"
      }
    };

    this.tooltip = {
      shared: false,
      y: {
        formatter: (val) => val.toFixed(2)
      }
    };
  }

  private getClosedDay(data: any[]): any {
    const today = new Date().getDate();
    return data.find(item => parseInt(item.dia, 10) === today);
  }

  private getLastDay(data: any[]): any {
    const today = new Date().getDate();
    const previousDay = today === 1 ? today : today - 1;
    return data.find(item => parseInt(item.dia, 10) === previousDay);
  }

  processBuy() {
    this.loadingService.present()
    const formattedValue = parseFloat(this.currentValue.toFixed(2));

    const quantidade = this.buyForm.value['quantidade'];
    const valor_compra = formattedValue * quantidade;
    var personData: any = localStorage.getItem('person')
    var personData = JSON.parse(personData);
    console.log(this.empresaObj[0].id);

    this.buyForm.patchValue({
      empresa: this.empresaObj[0].id,
      person: personData.id,
      valor_compra: valor_compra.toFixed(2),
      valor_acao: formattedValue
    });

    const formData = this.buyForm.value;



    this.homeBrokerS.processBuy(formData).subscribe(
      {
        next: async (res) => {
          this.loadingService.dismiss()
          this.sharedService.showToastSuccess('Sua compra foi efetuada com sucesso.')
          this.visible = false;
          this.sharedService.updateSaldo(Number(personData.saldo_atual) - valor_compra);

          this.router.navigate(['/staff'])
        },
        error: async (err) => {
          this.loadingService.dismiss()
          this.sharedService.showToastError("Saldo insuficiente!")

        }
      }
    )
  }
}
