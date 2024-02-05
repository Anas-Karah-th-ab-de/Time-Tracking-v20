import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlteprojekteComponent } from './alteprojekte.component';

describe('AlteprojekteComponent', () => {
  let component: AlteprojekteComponent;
  let fixture: ComponentFixture<AlteprojekteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AlteprojekteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlteprojekteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
