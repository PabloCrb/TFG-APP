import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringReport } from './recurring-report';

describe('RecurringReport', () => {
  let component: RecurringReport;
  let fixture: ComponentFixture<RecurringReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringReport],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
