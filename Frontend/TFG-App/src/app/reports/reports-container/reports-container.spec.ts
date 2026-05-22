import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsContainer } from './reports-container';

describe('ReportsContainer', () => {
  let component: ReportsContainer;
  let fixture: ComponentFixture<ReportsContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
