import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuturePredictionReport } from './future-prediction-report';

describe('FuturePredictionReport', () => {
  let component: FuturePredictionReport;
  let fixture: ComponentFixture<FuturePredictionReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuturePredictionReport],
    }).compileComponents();

    fixture = TestBed.createComponent(FuturePredictionReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
