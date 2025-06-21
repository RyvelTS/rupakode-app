/**
 * @fileoverview UIService class for managing user interface preferences.
 */
import { DOCUMENT, Inject, Injectable, OnDestroy, PLATFORM_ID, Renderer2, RendererFactory2, signal } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';

/**
 * Types for mode preferences and available themes.
 */
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

  /**
   * Cleanup function called when the UiService is destroyed.
   */
  ngOnDestroy(): void {
    if (this.isBrowser && this.colorSchemeDarkQuery && this.prefersColorSchemeChangeListener) {
      this.colorSchemeDarkQuery.removeEventListener('change', this.prefersColorSchemeChangeListener);
    }
  }

  /**
   * Initializes the theme based on stored preferences.
   */
  public initializeTheme(): void {
    if (!this.isBrowser) return;

    const storedTheme = this.getStoredThemePreference();
    this.activateTheme(storedTheme);
    const storedPreference = this.getStoredModePreference();
    this.activateMode(storedPreference)
  }

  /**
   * Activates the specified mode on the current document element.
   *
   * @param preference The mode preference to apply ('light', 'dark', or 'system').
   */
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

  /**
   * Activates a specified theme on the current document element.
   *
   * @param theme The theme name to apply.
   */
  private activateTheme(theme: ThemeName) {
    this._activeTheme.set(theme);
    this.storeThemePreference(theme);
    this.renderer.setAttribute(this.document.documentElement, 'data-theme', theme);
  }

  /**
   * Handles changes in client's color scheme preference.
   */
  private handleColorSchemeChange(): void {
    this.activateMode(this._activePreference());
  }

  /**
   * Toggles between current mode preference and the next valid one.
   */
  public toggleMode(): void {
    const currentPreference = this._activePreference();
    const cycle: ModePreference[] = ['system', 'light', 'dark'];
    const currentIndex = cycle.indexOf(currentPreference);
    const nextPreference = cycle[(currentIndex + 1) % cycle.length];
    this.activateMode(nextPreference);
  }

  /**
   * Toggles between current theme and the next valid one.
   */
  public toggleTheme(): void {
    const currentTheme = this._activeTheme();
    const cycle: ThemeName[] = ['stoneGray', 'casbahRock', 'forestGreen'];
    const currentIndex = cycle.indexOf(currentTheme);
    const nextTheme = cycle[(currentIndex + 1) % cycle.length];
    this.activateTheme(nextTheme);
  }

  /**
   * Stores the provided theme in the browser's local storage.
   *
   * @param theme The theme name to store.
   */
  private storeThemePreference(theme: ThemeName): void {
    if (!this.isBrowser) return;

    localStorage.setItem(UiService.THEME_STORAGE_KEY, theme);
  }

  /**
   * Retrieves the previously stored theme preference from local storage.
   * If no preference is stored, it returns a default theme.
   *
   * @returns The stored theme name or a default one if not stored.
   */
  private getStoredThemePreference(): ThemeName {
    const defaultTheme: ThemeName = 'stoneGray';
    if (!this.isBrowser) return defaultTheme;

    const stored = localStorage.getItem(UiService.THEME_STORAGE_KEY);
    return stored && UiService.VALID_THEMES.has(stored as ThemeName)
      ? stored as ThemeName
      : defaultTheme;
  }

  /**
   * Stores the provided mode preference in the browser's local storage.
   *
   * @param mode The mode preference to store.
   */
  private storeModePreference(mode: ModePreference): void {
    if (!this.isBrowser) return;

    localStorage.setItem(UiService.MODE_STORAGE_KEY, mode);
  }

  /**
   * Retrieves the previously stored mode preference from local storage.
   * If no preference is stored, it returns a default mode.
   *
   * @returns The stored mode preference or a default one if not stored.
   */
  private getStoredModePreference(): ModePreference {
    const defaultMode: ModePreference = 'system';
    if (!this.isBrowser) return defaultMode;

    const stored = localStorage.getItem(UiService.MODE_STORAGE_KEY);
    return stored && UiService.VALID_MODES.has(stored as ModePreference)
      ? stored as ModePreference
      : defaultMode;
  }
}
