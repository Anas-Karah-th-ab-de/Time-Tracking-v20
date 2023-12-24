import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduktionslinienComponent } from './produktionslinien.component';

describe('ProduktionslinienComponent', () => {
  let component: ProduktionslinienComponent;
  let fixture: ComponentFixture<ProduktionslinienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProduktionslinienComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProduktionslinienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
