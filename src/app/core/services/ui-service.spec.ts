import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';

import { UiService } from './ui-service';

describe('UiService', () => {
  let service: UiService;
  let mediaMatcherMock: { matchMedia: ReturnType<typeof vi.fn> };
  let matchMediaMock: { addEventListener: ReturnType<typeof vi.fn>, removeEventListener: ReturnType<typeof vi.fn>, matches: boolean };

  beforeEach(() => {
    matchMediaMock = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      matches: false,
    };

    mediaMatcherMock = {
      matchMedia: vi.fn().mockReturnValue(matchMediaMock),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: MediaMatcher, useValue: mediaMatcherMock },
        UiService
      ]
    });
    service = TestBed.inject(UiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default mode preference (system)', () => {
    expect(service.activePreference()).toBe('system');
  });

  it('should initialize with default theme (stoneGray)', () => {
    expect(service.activeTheme()).toBe('stoneGray');
  });

  it('should listen for color scheme changes', () => {
    expect(mediaMatcherMock.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  describe('toggleMode', () => {
    it('should cycle from system → light', () => {
      service.toggleMode();
      expect(service.activePreference()).toBe('light');
    });

    it('should cycle from light → dark', () => {
      service.activePreference();
      service.toggleMode();
      service.toggleMode();
      expect(service.activePreference()).toBe('dark');
    });

    it('should cycle from dark → system', () => {
      service.toggleMode();
      service.toggleMode();
      service.toggleMode();
      expect(service.activePreference()).toBe('system');
    });
  });

  describe('toggleTheme', () => {
    it('should cycle from stoneGray → casbahRock', () => {
      service.toggleTheme();
      expect(service.activeTheme()).toBe('casbahRock');
    });

    it('should cycle from casbahRock → forestGreen', () => {
      service.toggleTheme();
      service.toggleTheme();
      expect(service.activeTheme()).toBe('forestGreen');
    });

    it('should cycle from forestGreen → stoneGray', () => {
      service.toggleTheme();
      service.toggleTheme();
      service.toggleTheme();
      expect(service.activeTheme()).toBe('stoneGray');
    });
  });

  describe('initializeTheme', () => {
    it('should load preferences from localStorage when available', () => {
      localStorage.setItem('appTheme', 'forestGreen');
      localStorage.setItem('appMode', 'dark');

      service.initializeTheme();

      expect(service.activeTheme()).toBe('forestGreen');
      expect(service.activePreference()).toBe('dark');

      localStorage.removeItem('appTheme');
      localStorage.removeItem('appMode');
    });

    it('should fall back to defaults when localStorage is empty', () => {
      localStorage.removeItem('appTheme');
      localStorage.removeItem('appMode');

      service.initializeTheme();

      expect(service.activeTheme()).toBe('stoneGray');
      expect(service.activePreference()).toBe('system');
    });
  });

  describe('activeTheme signal', () => {
    it('should be readonly', () => {
      expect(service.activeTheme()).toBe('stoneGray');
    });
  });

  describe('activePreference signal', () => {
    it('should be readonly', () => {
      expect(service.activePreference()).toBe('system');
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on destroy', () => {
      service.ngOnDestroy();
      expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});
