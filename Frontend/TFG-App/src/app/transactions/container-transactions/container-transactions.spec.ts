import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerTransactions } from './container-transactions';

describe('ContainerTransactions', () => {
  let component: ContainerTransactions;
  let fixture: ComponentFixture<ContainerTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerTransactions],
    }).compileComponents();

    fixture = TestBed.createComponent(ContainerTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
