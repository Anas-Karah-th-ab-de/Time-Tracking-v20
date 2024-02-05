import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabeletComponent } from './tabelet.component';

describe('TabeletComponent', () => {
  let component: TabeletComponent;
  let fixture: ComponentFixture<TabeletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabeletComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TabeletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
