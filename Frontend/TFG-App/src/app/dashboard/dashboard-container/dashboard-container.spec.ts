import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardContainer } from './dashboard-container';

describe('DashboardContainer', () => {
  let component: DashboardContainer;
  let fixture: ComponentFixture<DashboardContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
