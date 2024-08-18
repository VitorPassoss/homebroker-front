import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private saldoAtualSubject = new BehaviorSubject<number>(0);  // Inicializa o saldo como 0
  saldoAtual$ = this.saldoAtualSubject.asObservable();

  constructor(
    private messageService: MessageService
  ) { }



  showToastSuccess(msg: string) {
    this.messageService.add({ key: 'tc', severity: 'success', summary: 'Sucesso', detail: msg });
  }

  showToastError(msg: string) {
    this.messageService.add({ key: 'tc', severity: 'error', summary: 'Erro', detail: msg });
  }

  updateSaldo(novoSaldo: any) {
    this.saldoAtualSubject.next(novoSaldo);
  }
}
