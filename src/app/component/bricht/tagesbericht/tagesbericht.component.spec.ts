import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagesberichtComponent } from './tagesbericht.component';

describe('TagesberichtComponent', () => {
  let component: TagesberichtComponent;
  let fixture: ComponentFixture<TagesberichtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TagesberichtComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TagesberichtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
