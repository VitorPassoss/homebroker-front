import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/shared/shared.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent  implements OnInit {

  saldoAtual: number = 0;
  person:any = null
  constructor(private balanceService: SharedService, public router: Router) {}

  ngOnInit(): void {
    // Inscreve-se para atualizações de saldo
    this.balanceService.saldoAtual$.subscribe(saldo => {
      this.saldoAtual = saldo;
    });

    var personData: any = localStorage.getItem('person');
    const person = JSON.parse(personData);
    this.person = person
    this.saldoAtual = person?.saldo_atual || 0;  
  }

  pay(){
    this.router.navigate(['pagamento']);
  }
}
