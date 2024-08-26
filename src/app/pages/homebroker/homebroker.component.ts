import { Subject } from 'rxjs';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { SharedService } from 'src/app/shared/shared.service';
import { StaffService } from '../staff/staff.service';
import { HomebrokerService } from './homebroker.service';
import { FormBuilder, FormGroup } from "@angular/forms";
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as ApexCharts from 'apexcharts'


@Component({
  selector: 'app-homebroker',
  templateUrl: './homebroker.component.html',
  styleUrls: ['./homebroker.component.scss']
})
export class HomebrokerComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  public initialValue = 0;
  public currentValue = this.initialValue;
  public variation = 0;
  public valorFinal = 0;
  
  wallets:any = []

  empresas: any[] = [];
  empresa: any = null;
  empresaObj: any = null;
  closeds: any = [];
  currentClosed: any = null;
  lastDay: any = null;
  visible: boolean = false;
  buyForm: FormGroup;
  buyValue: any = 0;
  pregaoBool: boolean = false;
  loading: boolean = false;
  private updateSubscription!: any;
  chart: any;
  data: any = [];
  isSetData:boolean = false

  TICKINTERVAL: any = 60000; // 1 minuto em milissegundos
  XAXISRANGE: any = 777600000;
  flowCurrent:any = null
  lastDate: any = 0;

  visibleSell:any = false;

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
      valor_acao: [0],
      quantidade_vendida: [0]
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
      },
    });
  }

  async setupInitial() {
    const empresaId = Number(this.empresas[0].id);
    this.empresa = empresaId;

    this.empresaObj = await this.empresas.find(empresa => empresa.id === empresaId);

    this.homeBrokerS.getFlow(empresaId).subscribe({
      next: async (res) => {
        this.closeds = res;
        this.lastDay = await this.getLastDay(res);
        this.currentClosed = await this.getClosedDay(res);
        this.setupParams();
        this.addInitialData();
        this.initChartData();
        this.merkatFlow();
      }
    });
  }

  merkatFlow() {
    const now = new Date();
    const currentHour = now.getHours() + 1;
    const isBetween9And5PM = currentHour >= 9 && currentHour <= 23;
    if (isBetween9And5PM) {
      this.pregaoBool = true;
      this.loading = false;
      this.realtime();
    } else {
    
      this.pregaoBool = false;
      this.loading = false;
      return;
    }
  }

  private getCurrentTimeInBrasilia(): Date {
    const offset = -3; // GMT-3
    const now = new Date();
    return new Date(now.getTime() + offset * 3600 * 1000);
  }

  private initChartData(): void {
    const options = {
      series: [{
        name: this.empresaObj.nome,
        data: this.data.slice()
      }],
      chart: {
        name: this.empresaObj.nome,
        id: 'realtime',
        height: 350,
        type: 'area',
        toolbar: {
          show: true
        },
        zoom: {
          enabled: true
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      title: {
        text: this.empresaObj.nome,
        align: 'left'
      },
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'HH:mm:ss'
        }
      },
      yaxis: {
        labels: {
          formatter: (value: number) => {
            // Formata o valor como BRL
            return `R$ ${value.toFixed(2).replace('.', ',')}`;
          }
        }
      },
      legend: {
        show: true
      },
    };
  
    this.chart = new ApexCharts(document.querySelector("#chart"), options);
    this.chart.render();
  }
  

  private addInitialData(): void {
    const now = this.getCurrentTimeInBrasilia();
    this.currentValue = this.initialValue;
    for (let i = 0; i <= 10; i++) {
      const timestamp = new Date(now.getTime() - (10 - i) * 1000).getTime();
      const variationFactor = (Math.random() - 0.5) * (2 * this.variation);
      this.currentValue += this.currentValue * variationFactor;

      if(i == 10 && this.pregaoBool == false) {
        this.data.push({
          x: timestamp,
          y: this.valorFinal - 5
        })
        
        this.data.push({
          x: timestamp,
          y: this.valorFinal - 3
        })
        this.data.push({
          x: timestamp,
          y: this.valorFinal - 2
        })

        this.data.push({
          x: timestamp,
          y: this.valorFinal + 8
        })

        this.data.push({
          x: timestamp,
          y: this.valorFinal + 2
        })

        this.data.push({
          x: timestamp,
          y: this.valorFinal
        })
      } else {
        this.data.push({
          x: timestamp,
          y: this.currentValue.toFixed(2)
        });
      }
    }

    
  }

  setupParams(): void {
    if (this.currentClosed && this.lastDay) {
      this.currentValue = parseFloat(this.lastDay.valor_final);
      this.initialValue = parseFloat(this.lastDay.valor_final);
      this.valorFinal = parseFloat(this.currentClosed.valor_final);
      this.variation = parseFloat(this.currentClosed.variação);
    }
  }

  realtime() {
    setInterval(() => {
      const newDate = this.getCurrentTimeInBrasilia().getTime();
      let variationFactor = (Math.random() - 0.5) * (2 * this.variation);

      this.currentValue += this.currentValue * variationFactor;

      const formattedCurrentValue = parseFloat(this.currentValue.toFixed(2));

      this.data.push({
        x: newDate,
        y: formattedCurrentValue
      });

      // Limite o número de pontos de dados no gráfico
      if (this.data.length > 10) {
        this.data.shift();
      }

      this.chart.updateSeries([{
        data: this.data
      }]);

    }, 15000);
  }

  buyAct() {
    this.visible = true;
  }

  sellAct(){
    this.getWallet();
    this.visibleSell = true
  }
  

  async getWallet() {
    // Recupera dados da pessoa do localStorage
    const personData = JSON.parse(localStorage.getItem('person') || '{}');
  
    try {
      // Obtém as carteiras usando o ID da pessoa
      const wallets = await this.staffService.getWalletByID(personData.id).toPromise();
      this.wallets = wallets;
      console.log(this.wallets)

      // Para cada carteira, obtém o fluxo correspondente e adiciona ao objeto wallet
      for (let wallet of this.wallets) {
        // Obtém o último item do fluxo
        wallet.lastFlowItem = await this.getFlow(wallet.empresa.id);
        

        // Calcula o valor atual da cotação
        const valorAtualCotacao = wallet.lastFlowItem * wallet['quantidade'];
      
        const valorCompra = Number(wallet['valor_compra']);
      
        const diferenca = valorAtualCotacao - valorCompra;
      
        const porcentagem = valorCompra !== 0 ? (diferenca / valorCompra) * 100 : 0;
      
        wallet.porcentagem = Number(porcentagem);
      }

      this.getFlowByBussines()

      
    } catch (error) {
      console.error('Erro ao obter as carteiras ou fluxos:', error);
    }
  }


 async getFlowByBussines(){
     this.flowCurrent = await this.wallets.find((wallet:any) => wallet.empresa.id === this.empresaObj.id);
    console.log(this.flowCurrent)
  }

  getFlow(id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.homeBrokerS.getFlow(id).subscribe({
        next: (res: any) => {
          resolve(res[res.length - 1]);
        },
        error: (err: any) => reject(err)
      });
    });
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
    this.chart.destroy()
    this.isSetData = true
    this.data = []
    

    this.empresa = event.value;
    this.empresaObj = this.empresas.find(empresa => empresa.id === this.empresa);

    

    this.homeBrokerS.getFlow(event.value).subscribe({
      next: async (res) => {
        this.closeds = res;
        this.lastDay = await this.getLastDay(res);
        this.currentClosed = await this.getClosedDay(res);
        this.setupParams();
        this.addInitialData();
        this.initChartData();
        this.merkatFlow();
        
      }
    });
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

  processSell(){
    this.loadingService.present();
    const formattedValue = parseFloat(this.currentValue.toFixed(2));

    const quantidade = this.buyForm.value['quantidade'];
    const valor_compra = formattedValue * quantidade;
    var personData: any = localStorage.getItem('person');
    var personData = JSON.parse(personData);

    this.buyForm.patchValue({
      empresa: this.empresaObj.id,
      person: personData.id,
      quantidade_vendida: quantidade,
      valor_acao: parseFloat(this.currentValue.toFixed(2))
    });

    const formData = this.buyForm.value;

    console.log(formData)

    this.homeBrokerS.processSell(formData).subscribe({
      next: async (res) => {
        this.loadingService.dismiss();
        this.sharedService.showToastSuccess('Sua venda foi efetuada com sucesso.');
        this.visible = false;
        var valorSaldo = Number(personData.saldo_atual) + valor_compra
        this.sharedService.updateSaldo(valorSaldo.toFixed(2));
        this.router.navigate(['/staff']);
      },
      error: async (err) => {
        this.loadingService.dismiss();
        this.sharedService.showToastError("Saldo insuficiente!");
      }
    });
  
  }

  processBuy() {
    this.loadingService.present();
    const formattedValue = parseFloat(this.currentValue.toFixed(2));

    const quantidade = this.buyForm.value['quantidade'];
    const valor_compra = formattedValue * quantidade;
    var personData: any = localStorage.getItem('person');
    var personData = JSON.parse(personData);

    this.buyForm.patchValue({
      empresa: this.empresaObj.id,
      person: personData.id,
      valor_compra: valor_compra.toFixed(2),
      valor_acao: formattedValue
    });

    const formData = this.buyForm.value;

    this.homeBrokerS.processBuy(formData).subscribe({
      next: async (res) => {
        this.loadingService.dismiss();
        this.sharedService.showToastSuccess('Sua compra foi efetuada com sucesso.');
        this.visible = false;
        this.sharedService.updateSaldo(Number(personData.saldo_atual) - valor_compra);
        this.router.navigate(['/staff']);
      },
      error: async (err) => {
        this.loadingService.dismiss();
        this.sharedService.showToastError("Saldo insuficiente!");
      }
    });
  }
}
