// main.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuComponent } from '../menu/menu.component'; // Import MenuComponent se estiver no mesmo diretório
import { SharedService } from 'src/app/shared/shared.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  saldoAtual: number = 0;
  person: any = null;

  @ViewChild(MenuComponent) menuComponent: MenuComponent | undefined;

  constructor(private balanceService: SharedService, public router: Router) {}

  ngOnInit(): void {
    this.balanceService.saldoAtual$.subscribe(saldo => {
      this.saldoAtual = saldo;
      const person = JSON.parse(personData);
      person.saldo_atual = saldo.toFixed(2);
      localStorage.setItem('person', JSON.stringify(person));
    });

    var personData: any = localStorage.getItem('person');
    const person = JSON.parse(personData);
    this.person = person;
    this.saldoAtual = person?.saldo_atual || 0;

    this.verifySaldo();
  }

  verifySaldo() {
    setTimeout(() => {
      var personData: any = localStorage.getItem('person');
      const person = JSON.parse(personData);
      this.person = person;
      this.saldoAtual = person?.saldo_atual || 0;
    }, 1000);
  }

  pay() {
    this.router.navigate(['pagamento']);
  }

  toggleMenu() {
    if (this.menuComponent) {
      this.menuComponent.toggleMenu();
    }
  }
}
