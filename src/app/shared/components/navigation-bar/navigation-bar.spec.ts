import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';

import { NavigationBar } from './navigation-bar';

describe('NavigationBar', () => {
  let component: NavigationBar;
  let fixture: ComponentFixture<NavigationBar>;
  let mediaMatcherMock: { matchMedia: ReturnType<typeof vi.fn> };
  let matchMediaMock: { addEventListener: ReturnType<typeof vi.fn>, removeEventListener: ReturnType<typeof vi.fn>, matches: boolean };

  beforeEach(async () => {
    matchMediaMock = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      matches: false,
    };

    mediaMatcherMock = {
      matchMedia: vi.fn().mockReturnValue(matchMediaMock),
    };

    await TestBed.configureTestingModule({
      imports: [NavigationBar],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: MediaMatcher, useValue: mediaMatcherMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationBar);
    component = fixture.componentInstance;
    component.applicationName = 'TestApp';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the applicationName input', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('TestApp');
  });

  it('should have an applicationName input', () => {
    expect(component.applicationName).toBe('TestApp');
  });

  it('should render navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('nav a');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('should have a home link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('nav a');
    const linkTexts = Array.from(links).map(l => l.textContent?.trim() || '');
    const hasBeranda = linkTexts.some(t => t.includes('Beranda'));
    expect(hasBeranda).toBe(true);
  });

  it('should have a theme toggle element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const themeToggle = compiled.querySelector('[class*="cursor-pointer"]');
    expect(themeToggle).toBeTruthy();
  });

  it('should have a mode toggle button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const modeBtn = compiled.querySelector('button[matIconButton]');
    expect(modeBtn).toBeTruthy();
  });

  it('should have a uiService injected', () => {
    expect(component['uiService']).toBeTruthy();
  });
});
