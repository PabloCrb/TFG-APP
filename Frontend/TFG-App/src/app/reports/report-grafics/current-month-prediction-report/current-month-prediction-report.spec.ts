import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentMonthPredictionReport } from './current-month-prediction-report';

describe('CurrentMonthPredictionReport', () => {
  let component: CurrentMonthPredictionReport;
  let fixture: ComponentFixture<CurrentMonthPredictionReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentMonthPredictionReport],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentMonthPredictionReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
