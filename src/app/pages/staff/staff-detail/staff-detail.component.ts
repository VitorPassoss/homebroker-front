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
  empresaObj: any = null;
  closeds: any = [];
  currentClosed: any = null;
  lastDay: any = null;
  visible: boolean = false;
  buyForm: FormGroup
  buyValue: any = 0
  pregaoBool: boolean = false
  loading: boolean = true;
  idEmpresa: any = 1;
  wallets: any = []

  chart: any;
  data: any = [];
  visibleSell: any = false;
  flowCurrent: any = null
  isSetData: boolean = false
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
      valor_acao: [0],
      quantidade_vendida: [null],

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
        var resForm = this.calcularValoresFechamento(res);
        this.closeds = resForm;
        this.lastDay = await this.getLastDay(resForm);
        this.currentClosed = await this.getClosedDay(resForm);
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
    const dayOfWeek = now.getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; 
    const isBetween9And5PM = currentHour >= 10 && currentHour < 18;
  
    if ( isBetween9And5PM && !isWeekend) {
      this.pregaoBool = true;
      this.loading = false;
      this.realtime();  
    } else {
      if (this.chart) {
        this.chart.destroy();
      }
      // this.data = [];
      this.pregaoBool = false;
      this.loading = false;
      // this.addInitialData();
      // this.initChartData();
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
        label: 'HH:mm:ss'
    
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
    const startDate = new Date(currentYear, 7, 1); // Data de início: 01/08/2024 (Agosto)
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
    // Ordenar fechamentos por dia
    this.closeds.sort((a: any, b: any) => parseInt(a.dia) - parseInt(b.dia));
  
    // Variáveis para controle de mês, dia e contagem de registros processados
    let currentMonth = 7; // Começa em agosto (mês 7)
    let currentDay = 1;
    let processedRecords = 0; // Contador de registros processados
  
    const maxRecordsPerMonth = (month: number) => {
      // Se o mês tiver 31 dias, retorna 31, senão retorna 30
      return this.daysInMonth(currentYear, month) === 31 ? 31 : 30;
    };
  
    // Inicializa o mês e dia corrente para o processamento dos registros
    let dayOffset = 0;
    let daysInCurrentMonth = this.daysInMonth(currentYear, currentMonth);
  
    this.closeds.forEach((closed: any) => {
        let day = parseInt(closed.dia);
  
        // Adiciona ao gráfico somente os registros dentro do período
        if (dayOffset < daysPassed) {
            processedRecords++;
            
            if (processedRecords > maxRecordsPerMonth(currentMonth)) {
                if (currentMonth > 11) {
                    currentMonth = 0; // Volta para janeiro
                }
                daysInCurrentMonth = this.daysInMonth(currentYear, currentMonth);
                processedRecords = 1; 
            }
  
            // Calcula o timestamp com base no mês e dia atual
            const timestamp = new Date(currentYear, currentMonth, day, 5).getTime();
  
            this.data.push({
                x: timestamp,
                y: parseFloat(closed.valor_final)
            });
  
            currentDay = day;
            dayOffset++;
        }
    });
  
    console.log(this.data);
  }
  
  
  private daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

  setupParams(): void {
    const now = new Date();
    const currentHour = now.getHours() + 1;
    const isBetween9And5PM = currentHour >= 10 && currentHour < 18;
    this.currentValue =  parseFloat(this.currentClosed.valor_fina);
    this.valorFinal  =  parseFloat(this.currentClosed.valor_final);
  
    if (this.currentClosed && this.lastDay) {
      this.initialValue = parseFloat(this.lastDay.valor_final);
      this.currentValue = parseFloat(this.currentClosed.valor_final);
      this.variation = parseFloat(this.currentClosed.variação);
  
      if (currentHour >= 0 && currentHour < 10) {
        this.valorFinal = parseFloat(this.lastDay.valor_final);
        this.currentValue = parseFloat(this.lastDay.valor_final);
  
      }
      
    
  
    }
  }

  realtime() {
    let dataAdditionCount = 0;
    const newDate = this.getCurrentTimeInBrasilia().getTime();
  
    const rangeStart = newDate - 60000; 
    this.data.push({
      x: newDate - 15000,
      y: this.currentValue - 0.54
    });
  
    
    this.data.push({
      x: newDate - 10000,
      y: this.currentValue - 0.33
    });
      // Adicione os novos dados
      this.data.push({
        x: newDate - 5000,
        y: this.currentValue - 0.24
      });
  
    this.chart.updateOptions({
      xaxis: {
        min: rangeStart,
        max: newDate
      }
    });
  
    this.chart.updateSeries([{
      data: this.data
    }]);
  
  
   setInterval(() => {
      const newDate = this.getCurrentTimeInBrasilia().getTime();
  
      // Verifique se this.variation está definido e é um número válido
      if (isNaN(this.variation)) {
        console.error('O valor de this.variation não é um número válido');
        return;
      }
  
      // Calcule o fator de variação
      let variationFactor = (Math.random() - 0.5) * (2 * this.variation);
  
      // Verifique se this.currentValue é um número válido
      if (isNaN(this.currentValue)) {
        console.error('O valor de this.currentValue não é um número válido');
        return;
      }
  
      // Atualize o valor atual
      this.currentValue += this.currentValue * variationFactor / 100;
      this.currentValue = parseFloat(this.currentValue.toFixed(2));
  
      // Adicione os novos dados
      this.data.push({
        x: newDate,
        y: this.currentValue
      });
  
      // Limite o número de pontos no gráfico (opcional)
      if (this.data.length > 1000) { // Por exemplo, manter apenas os últimos 1000 pontos
        this.data.shift(); // Remove o ponto mais antigo
      }
  
      // Atualize a série do gráfico
   
     
  
      dataAdditionCount++;
  
      
      if (dataAdditionCount >= 3) {
        const rangeStart = newDate - 60000; 
  
        this.chart.updateSeries([{
          data: this.data
        }]);
    
        this.chart.updateOptions({
          xaxis: {
            min: rangeStart,
            max: newDate
          }
        });
  
        dataAdditionCount = 0;
      }
    }, 1000); // Atualizar a cada 15 segundos
  }

  buyAct() {
    this.visible = true;
  }

  sellAct() {
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


  calcularValoresFechamento(fechamentos:any[]) {
    // Ordenar fechamentos por dia para garantir que o cálculo ocorra na sequência correta
    fechamentos.sort((a, b) => parseInt(a.dia) - parseInt(b.dia));

    // Inicializar valor acumulado com o valor_final do primeiro fechamento
    let valorAcumulado = parseFloat(fechamentos[0].valor_final.toString().replace(',', '.'));

    for (let i = 0; i < fechamentos.length; i++) {
        const fechamento = fechamentos[i];
        
        // Converter a string porcentagem para número
        const porcentagem = parseFloat(fechamento.porcentagem.replace(',', '.'));

        // Calcular o novo valor acumulado com base na porcentagem
        valorAcumulado += valorAcumulado * (porcentagem / 100);

        // Atualizar o valor_final com o valor acumulado calculado
        fechamento.valor_final = parseFloat(valorAcumulado.toFixed(2));
    }

    return fechamentos;
}

  

  async getFlowByBussines() {
    this.flowCurrent = await this.wallets.find((wallet: any) => wallet.empresa.id === this.empresaObj.id);
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
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Dias desde 1º de agosto

    const sortedData = data.sort((a, b) => parseInt(a.dia, 10) - parseInt(b.dia, 10));

    return sortedData.find(item => parseInt(item.dia, 10) - 1 === daysPassed);
  }

  private getLastDay(data: any[]): any {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = new Date(currentYear, 7, 1); // 1 de agosto
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Dias desde 1º de agosto
    const previousDay = daysPassed; // Penúltimo dia

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
