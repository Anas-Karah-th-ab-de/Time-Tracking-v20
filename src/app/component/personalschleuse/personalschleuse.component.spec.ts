import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalschleuseComponent } from './personalschleuse.component';

describe('PersonalschleuseComponent', () => {
  let component: PersonalschleuseComponent;
  let fixture: ComponentFixture<PersonalschleuseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonalschleuseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalschleuseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
