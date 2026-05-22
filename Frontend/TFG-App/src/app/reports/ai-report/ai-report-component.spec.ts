import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiReport } from './ai-report-component';

describe('AiReport', () => {
  let component: AiReport;
  let fixture: ComponentFixture<AiReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiReport],
    }).compileComponents();

    fixture = TestBed.createComponent(AiReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
