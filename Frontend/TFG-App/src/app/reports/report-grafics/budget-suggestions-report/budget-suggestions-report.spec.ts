import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetSuggestionsReport } from './budget-suggestions-report';

describe('BudgetSuggestionsReport', () => {
  let component: BudgetSuggestionsReport;
  let fixture: ComponentFixture<BudgetSuggestionsReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetSuggestionsReport],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetSuggestionsReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
