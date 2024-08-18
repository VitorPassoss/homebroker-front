import { Component, OnInit } from '@angular/core';
import { ProducaoService } from '../../producao/producao.service';
import { LoadingService } from 'src/app/shared/services/loading.service';
import { SaidasService } from '../saidas.service';
import { SharedService } from 'src/app/shared/shared.service';

@Component({
  selector: 'app-saidas-destinacao',
  templateUrl: './saidas-destinacao.component.html',
  styleUrls: ['./saidas-destinacao.component.scss']
})
export class SaidasDestinacaoComponent implements OnInit {

  visible:boolean = false

  destinacoes: any[] = []
  formData = {
    nome:''
  }

  editing: any = null;

  constructor(
    public producaoService:ProducaoService,
    public loadingService: LoadingService,
    public saidaService: SaidasService,
    public sharedService: SharedService
  ){

  }

  ngOnInit() {
  }


  getDestinos(){
    this.producaoService.destinacoes().subscribe(
      {
        next: (res) => {
          this.destinacoes = res
        }
      }
    )
  }


  saveDestino(){
    this.loadingService.present()
    if (this.editing) { 
      this.saidaService.updateDestinacao(this.editing.id, this.formData).subscribe({
        next: async () => {
          this.getDestinos()
          this.sharedService.showToastSuccess("Item atualizado com sucesso");
          this.visible = false;
          this.editing = null;
          this.formData.nome = ''
          this.loadingService.dismiss()
        },
        error: async () => {
          this.loadingService.dismiss()
          this.sharedService.showToastError("Ocorreu algum problema na atualização");
        }
      });
    }else{
      this.producaoService.SaveDestinacoes(this.formData).subscribe(
        {
          next: (res) => {
            this.loadingService.dismiss()
            this.getDestinos()
            this.visible = false
          }
        }
      )
    }
    
  }


  showEdit(item: any) {
    this.editing = item;
    this.formData.nome = item.nome; 
    this.visible = true;
  }

  async delete(id:number){
    this.loadingService.present()
    this.saidaService.deleteDestinacao(id).subscribe(
      {
        next: async (res) => {
          this.loadingService.dismiss()
          this.sharedService.showToastSuccess('Insumo deletado com sucesso')
          this.getDestinos()
        },
        error: async (err) => {
          this.loadingService.dismiss()
          this.sharedService.showToastError('Erro ao deletar Insumo: '+ err)
        }
      }
    )
  
  
  }


  openAdd(){
    this.visible = true
  }


}
