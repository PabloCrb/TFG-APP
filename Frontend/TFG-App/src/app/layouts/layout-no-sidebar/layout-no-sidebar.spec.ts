import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutNoSidebar } from './layout-no-sidebar';

describe('LayoutNoSidebar', () => {
  let component: LayoutNoSidebar;
  let fixture: ComponentFixture<LayoutNoSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutNoSidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutNoSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
