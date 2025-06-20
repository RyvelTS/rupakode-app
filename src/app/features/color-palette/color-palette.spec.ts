import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorPalette } from './color-palette';

describe('ColorPalette', () => {
  let component: ColorPalette;
  let fixture: ComponentFixture<ColorPalette>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPalette]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColorPalette);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
