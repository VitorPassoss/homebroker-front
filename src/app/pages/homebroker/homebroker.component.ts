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
        console.log('aaa')
        console.log(this.currentClosed)
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
    const isBetween9And5PM = currentHour >= 10 && currentHour < 18;

    console.log(isBetween9And5PM)



    if (isBetween9And5PM) {
      this.pregaoBool = true;
      this.loading = false;
      this.realtime();
    } else {
      this.chart.destroy();
      this.data = [];
      this.pregaoBool = false;
      this.loading = false;
      this.addInitialData();
      this.initChartData();
    }

    console.log(this.pregaoBool)
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
        type: 'line',
        animations: {
          enabled: true,
          easing: 'linear',
          dynamicAnimation: {
            speed: 1000
          }
        },
        toolbar: {
          show: true
        },
        zoom: {
          enabled: true,
          autoScaleYaxis: true // Ajusta automaticamente o eixo Y ao fazer zoom
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
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = new Date(currentYear, 7, 1); // Data de início: 01/08/2024
    const baseMonth = 7; // Mês de agosto (0-indexado, agosto é 7)

    // Calcular quantos dias passaram desde o início de agosto até hoje
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    console.log(daysPassed);
    console.log(this.closeds.length);

    // Ordenar fechamentos por dia
    this.closeds.sort((a: any, b: any) => parseInt(a.dia) - parseInt(b.dia));

    // Adicionar fechamentos ao gráfico considerando meses e dias
    this.closeds.forEach((closed: any, index: number) => {
      let day = parseInt(closed.dia);
      let month = baseMonth;

      // Calcular mês e dia considerando dias que excedem 31
      while (day > 31) {
        day -= 31;
        month += 1; // Passa para o próximo mês
      }

      // Se o mês calculado for maior que 11 (dezembro), reseta para 0 (janeiro do próximo ano)
      if (month > 11) {
        month -= 12;
      }

      const timestamp = new Date(currentYear, month, day, 8).getTime();

      this.data.push({
        x: timestamp,
        y: parseFloat(closed.valor_final)
      });
    });

    const nowH = new Date();
    const currentHour = nowH.getHours() + 1;

    // Se o horário estiver entre meia-noite e 10 horas da manhã
    if (currentHour >= 0 && currentHour < 10) {
      this.data.pop(); // Remove o último registro

      if (this.data.length > 0) {
        const previousEntry = this.data[this.data.length - 1];
        this.data.push({
          x: previousEntry.x, // Reutilizar o timestamp do dia anterior
          y: previousEntry.y  // Reutilizar o valor do dia anterior
        });
      }
    }
  }



setupParams(): void {
  const now = new Date();
  const currentHour = now.getHours() + 1;
  const isBetween9And5PM = currentHour >= 10 && currentHour < 18;

  if (this.currentClosed && this.lastDay) {
    this.initialValue = parseFloat(this.lastDay.valor_final);
    this.currentValue = parseFloat(this.currentClosed.valor_final);
    this.variation = parseFloat(this.currentClosed.variação);

    if (currentHour >= 0 && currentHour < 10) {
      this.valorFinal = parseFloat(this.lastDay.valor_final);
      this.currentValue = parseFloat(this.lastDay.valor_final.toFixed(2));

    }
    

    if (currentHour >= 18 && currentHour < 24) {
      this.currentValue = this.currentClosed.valor_final.toFixed(2);
      this.valorFinal  = this.currentClosed.valor_final.toFixed(2);
    }

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

    // Atualizar a série e ajustar o intervalo de zoom para o modo de atualização em tempo real
    this.chart.updateSeries([{
      data: this.data
    }]);

    // Ajustar zoom para o modo de seconds se realtime estiver ativado
    if (this.pregaoBool) {
      this.chart.zoomX(newDate - 30000, newDate); // Zoom nos últimos 30 segundos
    }

  }, 45000);
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
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = new Date(currentYear, 7, 1); // 1 de agosto
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); 

    return data.find(item => parseInt(item.dia, 10)  === daysPassed + 1);
  }
  
  private getLastDay(data: any[]): any {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = new Date(currentYear, 7, 1); // 1 de agosto
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Dias desde 1º de agosto
    const previousDay = daysPassed - 1; // Penúltimo dia
  
    // Ordenar os dados por dia
    const sortedData = data.sort((a, b) => parseInt(a.dia, 10) - parseInt(b.dia, 10));
  
    // Encontrar o fechamento que corresponde ao penúltimo dia
    return sortedData.find(item => parseInt(item.dia, 10) === previousDay);
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
