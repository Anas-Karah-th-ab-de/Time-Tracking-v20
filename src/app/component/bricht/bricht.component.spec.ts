import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrichtComponent } from './bricht.component';

describe('BrichtComponent', () => {
  let component: BrichtComponent;
  let fixture: ComponentFixture<BrichtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BrichtComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BrichtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
