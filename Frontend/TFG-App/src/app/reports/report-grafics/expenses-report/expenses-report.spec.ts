import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpensesReport } from './expenses-report';

describe('ExpensesReport', () => {
  let component: ExpensesReport;
  let fixture: ComponentFixture<ExpensesReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesReport],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
