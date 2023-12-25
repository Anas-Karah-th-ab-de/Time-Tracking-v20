import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitarbeiterErstellenComponent } from './mitarbeiter-erstellen.component';

describe('MitarbeiterErstellenComponent', () => {
  let component: MitarbeiterErstellenComponent;
  let fixture: ComponentFixture<MitarbeiterErstellenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MitarbeiterErstellenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MitarbeiterErstellenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
