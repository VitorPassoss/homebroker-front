import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomebrokerComponent } from './homebroker.component';

describe('HomebrokerComponent', () => {
  let component: HomebrokerComponent;
  let fixture: ComponentFixture<HomebrokerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomebrokerComponent]
    });
    fixture = TestBed.createComponent(HomebrokerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
