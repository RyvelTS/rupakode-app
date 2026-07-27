import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home-page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the app name in heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1!.textContent).toContain(component.appName);
  });

  it('should have navigation links to color-palette and git-message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    const linkTexts = Array.from(links).map(l => l.textContent?.trim() || '');
    const hasColorPalette = linkTexts.some(t => t.includes('Palet Warna'));
    const hasGitMessage = linkTexts.some(t => t.includes('Pesan Git'));
    expect(hasColorPalette).toBe(true);
    expect(hasGitMessage).toBe(true);
  });

  it('should have an appName property from environment', () => {
    expect(component.appName).toBeTruthy();
    expect(typeof component.appName).toBe('string');
  });

  it('should render the manfaat section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#manfaat')).toBeTruthy();
  });

  it('should render the fitur section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#fitur')).toBeTruthy();
  });
});
