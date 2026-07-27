import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MediaMatcher } from '@angular/cdk/layout';
import { App } from './app';

describe('App', () => {
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
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: MediaMatcher, useValue: mediaMatcherMock }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have a router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should have a title property', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['title']).toBe('rupakode-app');
  });
});
