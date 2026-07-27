import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';

import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    const matchMediaMock = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      matches: false,
    };
    const mediaMatcherMock = {
      matchMedia: vi.fn().mockReturnValue(matchMediaMock),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: MediaMatcher, useValue: mediaMatcherMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a currentYear property', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  it('should have APP_NAME from environment', () => {
    expect(component['APP_NAME']).toBeTruthy();
    expect(typeof component['APP_NAME']).toBe('string');
  });

  it('should render a header element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header')).toBeTruthy();
  });

  it('should render a main element with router-outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main router-outlet')).toBeTruthy();
  });

  it('should render a footer with copyright', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('footer');
    expect(footer).toBeTruthy();
    expect(footer!.textContent).toContain(component['APP_NAME']);
    expect(footer!.textContent).toContain(String(component.currentYear));
  });

  it('should render the navigation bar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navigation-bar')).toBeTruthy();
  });
});
