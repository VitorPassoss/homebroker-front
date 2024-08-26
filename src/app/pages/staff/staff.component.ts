import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { SharedService } from 'src/app/shared/shared.service';
import { StaffService } from './staff.service';
import { Router } from '@angular/router';
import { HomebrokerService } from '../homebroker/homebroker.service';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss']
})
export class StaffComponent {


  staffs:any[] = [];

  staffForm: FormGroup
  visible: boolean = false;
  statusVis:boolean = false
  editingStaff:boolean = false;
  empresas:any = []
  cargos:any = []
  status:any = []
  turnos:any = []
  selected:any = null
  idStaffSelected = null;
  searchString: string = '';
  wallets:any = []
  items = [
    {
        label: 'Alterar Situção',
        command: () => {
        }
    },
   
    {
        label: 'Descartar',
        command: () => {
        }
    },
    {
      label: 'Deletar',
      command: () => {
      },
    },
    {
      label: 'Editar ',
      command: () => {
      }
},
   
];
  
  constructor(
    private formBuilder: FormBuilder,
    public sharedService: SharedService,
    public loadingService: LoadingService,
    public staffService: StaffService,
    public routerService: Router,
    public homeBrokerS: HomebrokerService
  ){
    this.staffForm = this.formBuilder.group({
      nome: [null, Validators.required],
      pis: [null, Validators.required],
      jornada: [null, Validators.required],
      turnos: [null, Validators.required],
      contato_phone: [null, [Validators.required]],
      contato_email: [null, [Validators.required]],
      cpf: [null, [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
      empresa: [null, Validators.required],
      status: [null, Validators.required],
      cargo: [null, Validators.required],
      dt_nascimento: [null, Validators.required],
      dt_entrada: [null],
      dt_saida: [null],
      custo_beneficios: [0],
      custo_salario: [0],
      custo_bruto: [0],
    });
  }

  ngOnInit() {
    this.getWallet();
  }


  async getWallet() {
    // Recupera dados da pessoa do localStorage
    const personData = JSON.parse(localStorage.getItem('person') || '{}');
  
    try {
      // Obtém as carteiras usando o ID da pessoa
      const wallets = await this.staffService.getWalletByID(personData.id).toPromise();
      this.wallets = wallets;

  
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
      
    } catch (error) {
      console.error('Erro ao obter as carteiras ou fluxos:', error);
    }
  }
  
  // Retorna uma Promise que resolve com o último item do array do fluxo
  getFlow(id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.homeBrokerS.getFlow(id).subscribe({
        next: (res: any) => {
          // Assume-se que 'res' é um array; modifica conforme necessário
          resolve(res[res.length - 1]);
        },
        error: (err: any) => reject(err)
      });
    });
  }
  
  async getStaffs(){

    this.staffService.getStaffs().subscribe(
      {
        next: async(res) => {
          console.log(res)
          this.staffs = res
        }
      }
    )
  }

  showAddStaff() {
    this.editingStaff = false;
    this.visible = true;
    this.statusVis = false
    this.staffForm.reset()

  }

  showEditstaff(staff: any) {
    this.editingStaff = true;
    this.staffForm.patchValue(staff); 
    this.visible = true;
    
  }

  navigateTo(id:any){
    this.routerService.navigate(['/homebroker/details/', id]);

  }


  searchList(){
    var bodySearch = {
      'search_string': this.searchString
    }

    this.staffService.search(bodySearch).subscribe({
      next: async (res) => {
        console.log(res)
        this.staffs = res
      },
      error: async () => {
        this.sharedService.showToastError("Ocorreu algum problema na busca do usuario");
      }
    });
  }
  

  updateStatus(staff:any){
    this.statusVis = true
        this.editingStaff = true;

    this.idStaffSelected = staff.id

    this.staffForm.patchValue({
      ...staff,
      status: staff.status.id,
      empresa: staff.empresa.id,
      cargo: staff.cargo.id,
      turnos: staff.turnos.id,
    });
  }


  async delete(id:number){
    this.loadingService.present()
    this.staffService.deleteStaffs(id).subscribe(
      {
        next: async (res:any) => {
          this.loadingService.dismiss()
          this.sharedService.showToastSuccess('Fornecedor deletado com sucesso')
          this.getStaffs()
        },
        error: async (err:any) => {
          this.loadingService.dismiss()
          this.sharedService.showToastError('Erro ao deletar fornecedor: '+ err)
        }
      }
    )
  }

  viewStaff(id: any) {
    this.routerService.navigate(['/staff/details/', id]);
  }
  

  onRowSelect(e:any){
    this.routerService.navigate(['/staff/details/', this.selected.id]);

  }

 



  
}
