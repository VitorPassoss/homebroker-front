        import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedService } from 'src/app/shared/shared.service';
import { InsumosService } from '../insumos.service';
import { LoadingService } from 'src/app/shared/services/loading.service';

@Component({
  selector: 'app-fornecedores',
  templateUrl: './fornecedores.component.html',
  styleUrls: ['./fornecedores.component.scss']
})
export class FornecedoresComponent implements OnInit {

  fornecedores: any[] = []
  fornecedorForm: FormGroup
  visible: boolean = false;
  editingFornecedor: any = null;


  constructor(
    public insumosService: InsumosService,
    private formBuilder: FormBuilder,
    public sharedService: SharedService,
    public loadingService: LoadingService
  ){
    this.fornecedorForm = this.formBuilder.group({
      nome: [null, Validators.required],
      cpf_cnpj: [null],
      razao_social: [null],
      contato: [null]
    })
  }

  ngOnInit() {
    this.getFornecedores()
  }





  showEditFornecedor(fornecedor: any) {
    this.editingFornecedor = fornecedor;
    this.fornecedorForm.patchValue(fornecedor); // popula o formulário
    this.visible = true;
  }
  

  async getFornecedores(){
    this.insumosService.getFornecedores().subscribe(
      {
        next: async(res) => {
          console.log(res)
          this.fornecedores = res
        }
      }
    )
  }

  showAddfornecedor() {
    this.visible = true;
  }

  async delete(id:number){
    this.loadingService.present()
    this.insumosService.deleteFornecedor(id).subscribe(
      {
        next: async (res) => {
          this.loadingService.dismiss()
          this.sharedService.showToastSuccess('Fornecedor deletado com sucesso')
          this.getFornecedores()
        },
        error: async (err) => {
          this.loadingService.dismiss()
          this.sharedService.showToastError('Erro ao deletar fornecedor: '+ err)
        }
      }
    )
  
  
  }

  submitForm() {
    if (this.fornecedorForm.valid) {
      const formData = this.fornecedorForm.value;
  
      if (this.editingFornecedor) { // If we are editing
        this.insumosService.updateFornecedor(this.editingFornecedor.id, formData).subscribe({
          next: async () => {
            this.getFornecedores()
            this.sharedService.showToastSuccess("Fornecedor atualizado com sucesso");
            this.visible = false;
            this.editingFornecedor = null;
            this.fornecedorForm.reset();
          },
          error: async () => {
            this.sharedService.showToastError("Ocorreu algum problema na atualização");
          }
        });
      } else { 
        this.insumosService.createFornecedor(formData).subscribe({
          next: async () => {
            this.getFornecedores();
            this.sharedService.showToastSuccess("Fornecedor criado com sucesso");
            this.visible = false;
            this.fornecedorForm.reset();
          },
          error: async () => {
            this.sharedService.showToastError("Ocorreu algum problema no registro");
          }
        });
      }
    } else {
      this.sharedService.showToastError("Insira um nome valido");
    }
  }
  
}
