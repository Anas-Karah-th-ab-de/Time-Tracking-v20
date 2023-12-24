import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjektleiterAbfrageComponent } from './projektleiter-abfrage.component';

describe('ProjektleiterAbfrageComponent', () => {
  let component: ProjektleiterAbfrageComponent;
  let fixture: ComponentFixture<ProjektleiterAbfrageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjektleiterAbfrageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjektleiterAbfrageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
