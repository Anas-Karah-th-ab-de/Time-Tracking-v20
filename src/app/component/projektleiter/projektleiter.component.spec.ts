import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjektleiterComponent } from './projektleiter.component';

describe('ProjektleiterComponent', () => {
  let component: ProjektleiterComponent;
  let fixture: ComponentFixture<ProjektleiterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjektleiterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjektleiterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
