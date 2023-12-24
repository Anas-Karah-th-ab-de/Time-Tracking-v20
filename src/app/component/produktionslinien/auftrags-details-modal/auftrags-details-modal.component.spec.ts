import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuftragsDetailsModalComponent } from './auftrags-details-modal.component';

describe('AuftragsDetailsModalComponent', () => {
  let component: AuftragsDetailsModalComponent;
  let fixture: ComponentFixture<AuftragsDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuftragsDetailsModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuftragsDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
