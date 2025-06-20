import { DOCUMENT, Inject, Injectable, OnDestroy, PLATFORM_ID, Renderer2, RendererFactory2, signal } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';

export type ModePreference = 'light' | 'dark' | 'system';
export type ThemeName = 'stoneGray' | 'casbahRock' | 'forestGreen';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private colorSchemeDarkQuery: MediaQueryList | undefined;
  private renderer: Renderer2;
  private isBrowser: boolean;

  private _activeMode = signal<Exclude<ModePreference, 'system'>>('light');
  private _activeTheme = signal<ThemeName>('stoneGray');
  public readonly activeTheme = this._activeTheme.asReadonly();
  private _activePreference = signal<ModePreference>('system');
  public readonly activePreference = this._activePreference.asReadonly();

  private prefersColorSchemeChangeListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | undefined;

  private static readonly VALID_MODES = new Set<ModePreference>(['light', 'dark', 'system']);
  private static readonly VALID_THEMES = new Set<ThemeName>(['stoneGray', 'casbahRock', 'forestGreen']);
  private static readonly THEME_STORAGE_KEY = 'appTheme';
  private static readonly MODE_STORAGE_KEY = 'appMode';

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private mediaMatcher: MediaMatcher
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.colorSchemeDarkQuery = this.mediaMatcher.matchMedia('(prefers-color-scheme: dark)');
      this.prefersColorSchemeChangeListener = this.handleColorSchemeChange.bind(this);
      this.colorSchemeDarkQuery.addEventListener('change', this.prefersColorSchemeChangeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser && this.colorSchemeDarkQuery && this.prefersColorSchemeChangeListener) {
      this.colorSchemeDarkQuery.removeEventListener('change', this.prefersColorSchemeChangeListener);
    }
  }

  public initializeTheme(): void {
    if (!this.isBrowser) return;

    const storedTheme = this.getStoredThemePreference();
    this.activateTheme(storedTheme);
    const storedPreference = this.getStoredModePreference();
    this.activateMode(storedPreference)
  }

  private activateMode(preference: ModePreference): void {
    this._activePreference.set(preference);
    let mode: Exclude<ModePreference, 'system'>;
    if (preference === 'system') {
      mode = this.colorSchemeDarkQuery!.matches ? 'dark' : 'light';
    } else {
      mode = preference;
    }

    this._activeMode.set(mode);
    this.storeModePreference(preference);
    this.renderer.setAttribute(this.document.documentElement, 'data-mode', mode);
  }

  private activateTheme(theme: ThemeName) {
    this._activeTheme.set(theme);
    this.storeThemePreference(theme);
    this.renderer.setAttribute(this.document.documentElement, 'data-theme', theme);
  }

  private handleColorSchemeChange(): void {
    this.activateMode(this._activePreference());
  }

  public toggleMode(): void {
    const currentPreference = this._activePreference();
    const cycle: ModePreference[] = ['system', 'light', 'dark'];
    const currentIndex = cycle.indexOf(currentPreference);
    const nextPreference = cycle[(currentIndex + 1) % cycle.length];
    this.activateMode(nextPreference);
  }

  public toggleTheme(): void {
    const currentTheme = this._activeTheme();
    const cycle: ThemeName[] = ['stoneGray', 'casbahRock', 'forestGreen'];
    const currentIndex = cycle.indexOf(currentTheme);
    const nextTheme = cycle[(currentIndex + 1) % cycle.length];
    this.activateTheme(nextTheme);
  }

  private storeThemePreference(theme: ThemeName): void {
    if (!this.isBrowser) return;

    localStorage.setItem(UiService.THEME_STORAGE_KEY, theme);
  }

  private getStoredThemePreference(): ThemeName {
    const defaultTheme: ThemeName = 'stoneGray';
    if (!this.isBrowser) return defaultTheme;

    const stored = localStorage.getItem(UiService.THEME_STORAGE_KEY);
    return stored && UiService.VALID_THEMES.has(stored as ThemeName)
      ? stored as ThemeName
      : defaultTheme;
  }

  private storeModePreference(mode: ModePreference): void {
    if (!this.isBrowser) return;

    localStorage.setItem(UiService.MODE_STORAGE_KEY, mode);
  }

  private getStoredModePreference(): ModePreference {
    const defaultMode: ModePreference = 'system';
    if (!this.isBrowser) return defaultMode;

    const stored = localStorage.getItem(UiService.MODE_STORAGE_KEY);
    return stored && UiService.VALID_MODES.has(stored as ModePreference)
      ? stored as ModePreference
      : defaultMode;
  }
}
