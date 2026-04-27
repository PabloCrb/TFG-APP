import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetContainerComponent } from './budget-container-component';

describe('BudgetContainerComponent', () => {
  let component: BudgetContainerComponent;
  let fixture: ComponentFixture<BudgetContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetContainerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
