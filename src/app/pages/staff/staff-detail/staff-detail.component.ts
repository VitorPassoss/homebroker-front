import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subject, interval } from 'rxjs';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { SharedService } from 'src/app/shared/shared.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaffService } from '../staff.service';
import { HomebrokerService } from '../../homebroker/homebroker.service';
import * as ApexCharts from 'apexcharts'

@Component({
  selector: 'app-staff-detail',
  templateUrl: './staff-detail.component.html',
  styleUrls: ['./staff-detail.component.scss']
})
export class StaffDetailComponent {

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
  wallets:any = []

  chart: any;
  data: any = [];
  visibleSell:any = false;
  flowCurrent:any = null
  isSetData:boolean = false
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
    this.route.paramMap.subscribe(params => {
      this.idEmpresa = params.get('id');
    });
    this.getEmpresas();

  }



  getEmpresas() {
    this.staffService.getEmpresas().subscribe({
      next: async (res) => {
        this.empresas = res;
        this.setupInitial();
      }
    });
  }

  async setupInitial() {
    const empresaId = Number(this.idEmpresa);
    this.empresa = Number(this.idEmpresa);

    this.empresaObj = this.empresas.find(empresa => empresa.id == empresaId);

    console.log(this.empresaObj)
    console.log(empresaId)

    this.homeBrokerS.getFlow(empresaId).subscribe({
      next: async (res) => {
        console.log(res)
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
    const currentHour = now.getHours() + 1; // Ajustando fuso horário se necessário
    const isBetween9And5PM = currentHour >= 10 && currentHour < 18;
    
    if (isBetween9And5PM) {
      this.pregaoBool = true;
      this.loading = false;
      this.realtime(); 
    } else {
      this.chart.destroy();
      this.data = [];
      this.pregaoBool = false;
      this.loading = false;
      
      const currentYear = now.getFullYear(); // Obtém o ano atual
      const august = 7; // Mês de agosto é 7 (base 0, onde janeiro é 0)
      
      // Ordenar os fechamentos por dia antes de adicionar no gráfico
      this.closeds.sort((a: any, b: any) => parseInt(a.dia) - parseInt(b.dia));

      // Itera sobre cada fechamento e adiciona no gráfico
      this.closeds.forEach((closed: any) => {
        const day = parseInt(closed.dia); // Extrai o dia do fechamento
        const timestamp = new Date(currentYear, august, day, 14).getTime(); // Define a data com hora 17:00

        this.data.push({
          x: timestamp,
          y: parseFloat(closed.valor_final)
        });
      });

      this.initChartData2(); // Inicializa o gráfico com os novos dados

      console.log(this.data)
      console.log(this.closeds)
      this.currentValue = this.valorFinal;
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
  private initChartData2(): void {
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
  
      // Atualiza o valor atual com a variação calculada
      this.currentValue += this.currentValue * variationFactor;
  
     
        this.data.push({
          x: timestamp,
          y: parseFloat(this.currentValue.toFixed(2))
        });
      
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
