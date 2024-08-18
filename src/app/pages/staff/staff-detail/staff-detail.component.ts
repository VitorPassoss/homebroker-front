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
import { takeUntil } from 'rxjs/operators';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { SharedService } from 'src/app/shared/shared.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaffService } from '../staff.service';
import { HomebrokerService } from '../../homebroker/homebroker.service';

@Component({
  selector: 'app-staff-detail',
  templateUrl: './staff-detail.component.html',
  styleUrls: ['./staff-detail.component.scss']
})
export class StaffDetailComponent {
  public series!: any;
  public chart!: ApexChart;
  public dataLabels!: ApexDataLabels;
  public markers!: ApexMarkers;
  public title!: ApexTitleSubtitle;
  public fill!: ApexFill;
  public yaxis!: ApexYAxis;
  public xaxis!: ApexXAxis;
  public tooltip!: ApexTooltip;

  public destroy$ = new Subject<void>();
  public initialValue = 0;
  public currentValue = this.initialValue;
  public variation = 0;
  public valorFinal = 0;

  empresas: any[] = [];
  empresa: any = null;
  empresaObj:any = null;
  closeds: any = [];
  currentClosed: any = null;
  lastDay:any = null;
  visible: boolean = false;
  buyForm: FormGroup
  buyValue:any = 0
  pregaoBool:boolean = false
  loading: boolean = true;
  idEmpresa:any = 1;
  constructor(
    public sharedService: SharedService,
    public loadingService: LoadingService,
    public staffService: StaffService,
    public homeBrokerS: HomebrokerService,
    public routerService: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    

  ) { 
    this.buyForm = this.formBuilder.group({
      person: [null],
      quantidade: [null],
      empresa: [null],
      valor_compra: [null],
      valor_acao: [0]
    })
  }

  ngOnInit(): void {
    this.loadingService.present()
    this.route.paramMap.subscribe(params => {
      this.idEmpresa = params.get('id');
    });
    this.getEmpresas();

  }

  buyAct(){
    this.visible = true
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getEmpresas() {
    this.staffService.getEmpresas().subscribe({
      next: async (res) => {
        this.empresas = res;
        this.setupInitial();
      }
    });
  }


  verifyBuyValue(){
    const formattedValue = parseFloat(this.currentValue.toFixed(2));
    const quantidade = this.buyForm.value['quantidade'];
    const valor_compra = formattedValue * quantidade;
    this.buyValue = valor_compra;
  }


  setupInitial() {
    
    const empresaId = Number(this.idEmpresa);

    this.empresaObj = this.empresas.filter(empresa => empresa.id === empresaId);


    console.log(this.empresas)
    console.log(this.idEmpresa)
    console.log(this.empresaObj)
    
    this.homeBrokerS.getFlow(this.idEmpresa).subscribe({
      next: async (res) => {
        this.closeds = res;
        this.lastDay = this.getLastDay(res);  
        this.currentClosed = this.getClosedDay(res);  
        this.setupParams();
        this.initChartData();
        this.updateChart();
        this.loadingService.dismiss()

      }
    });
  }
  setupParams(): void {
    if (this.currentClosed) {
      this.initialValue = this.lastDay ? parseFloat(this.lastDay.valor_final) : 0;
      this.valorFinal = parseFloat(this.currentClosed.valor_final);
      this.variation = (parseFloat(this.currentClosed.variação) / 100) ;
    }
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
  private addInitialData(): void {
    const now = new Date();
    this.currentValue = this.initialValue; 
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - (10 - i) * 1000).toISOString();
      const variationFactor = (Math.random() - 0.5) * (2 * this.variation);
      this.currentValue += this.currentValue * variationFactor;

      this.series[0].data.push({
        x: new Date(timestamp).getTime(),
        y: this.currentValue
      });

      this.xaxis.categories.push(timestamp);
    }
  }


  private addEndOfDayValues = () => {
    const now = new Date();
    const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0).getTime(); // Define o horário base como 17:00:00
    const step = 10 * 60 * 1000; // Intervalo de 10 minutos
    const valueStep = this.valorFinal * 0.01; // Pequena variação de 1% do valor final

    // Adiciona valores com horários antes das 17h
    for (let i = 0; i < 9; i++) {
      const timestamp = baseTime - (10 - i) * step; // Horários antes das 17h
      const value = this.valorFinal - ((9 - i) * valueStep); // Valores próximos ao valor final, com pequena variação
      this.series[0].data.push({
        x: timestamp, // Adiciona timestamp em milissegundos
        y: parseFloat(value.toFixed(2)) // Garante que o valor tenha apenas duas casas decimais
      });
      this.xaxis.categories.push(new Date(timestamp).toISOString()); // Adiciona a categoria de data no formato ISO
    }
  
    // Adiciona o último valor exatamente às 17:00:00
    const endOfDayTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0).getTime();
    this.series[0].data.push({
      x: endOfDayTimestamp, // Timestamp exato para 17:00:00
      y: parseFloat(this.valorFinal.toFixed(2)) // Valor final com duas casas decimais
    });
    this.xaxis.categories.push(new Date(endOfDayTimestamp).toISOString()); // Adiciona a categoria de data no formato ISO
  
    // Garantir que o gráfico pare de atualizar após adicionar os 10 valores
    this.destroy$.next(); 
  };
  
  
  private addValuesDuringDay = () => {
    let variationFactor = (Math.random() - 0.5) * (2 * this.variation);
    this.currentValue += this.currentValue * variationFactor;
  
    if (this.series[0].data.length >= 10) {
      this.series[0].data.shift();
    }
  
    this.series[0].data.push({
      x: new Date().getTime(), // Adiciona timestamp em milissegundos
      y: this.currentValue
    });
  
    // Atualizando as categorias do eixo x
    if (this.xaxis.categories.length >= 10) {
      this.xaxis.categories.shift();
    }
    this.xaxis.categories.push(new Date().toISOString()); // Adiciona a categoria de data no formato ISO
  };
  

  private updateChart(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const isBetween9And5PM = currentHour >= 9 && currentHour < 17;
    
    if (isBetween9And5PM) {
      this.pregaoBool = true
      this.addInitialData();
      this.loading = false

      interval(15000).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.addValuesDuringDay();
      });
    } else {
      this.pregaoBool = false

     
        this.addEndOfDayValues();
        this.loading = false

      return; 
    }

  }
  

  private initChartData(): void {
    this.series = [
      {
        name: this.empresaObj[0].nome,
        data: []
      }
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
      }
    };

    this.dataLabels = {
      enabled: false
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
        formatter: (val) => `R$ ${val.toFixed(2)}`
      },
      title: {
        text: "Preço"
      }
    };

    this.xaxis = {
      type: "datetime",
      categories: [],
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


  processBuy(){
    this.loadingService.present()
    const formattedValue = parseFloat(this.currentValue.toFixed(2));

    const quantidade = this.buyForm.value['quantidade'];
    const valor_compra = formattedValue * quantidade;
    var personData:any = localStorage.getItem('person')
    var personData = JSON.parse(personData);

    this.buyForm.patchValue({
      empresa: this.empresaObj[0].id,
      person: personData.id,
      valor_compra: valor_compra.toFixed(2),
      valor_acao: formattedValue
    });

    const formData = this.buyForm.value;



    this.homeBrokerS.processBuy(formData).subscribe(
      {
        next: async(res) => {
          this.loadingService.dismiss()
          this.sharedService.showToastSuccess('Sua compra foi efetuada com sucesso.')
          this.visible = false;
          this.sharedService.updateSaldo(Number(personData.saldo_atual) - valor_compra);  

          this.router.navigate(['/staff'])
        },
        error: async(err) => {
          this.loadingService.dismiss()
          this.sharedService.showToastError("Saldo insuficiente!")

        }
      }
    )
  }

}
