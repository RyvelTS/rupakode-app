import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

import { ColorPalette } from './color-palette';

describe('ColorPalette', () => {
  let component: ColorPalette;
  let fixture: ComponentFixture<ColorPalette>;

  beforeAll(() => {
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn() },
        writable: true,
      });
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPalette],
      providers: [
        provideZonelessChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorPalette);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default base color', () => {
    expect(component.baseColorHex()).toBe('#3b82f6');
  });

  it('should initialize with default saturation (100)', () => {
    expect(component.saturation()).toBe(100);
  });

  it('should initialize with default lightness (50)', () => {
    expect(component.lightness()).toBe(50);
  });

  it('should initialize with autoSave disabled', () => {
    expect(component.autoSave()).toBe(false);
  });

  it('should have appName from environment', () => {
    expect(component.appName).toBeTruthy();
  });

  it('should have currentYear set to current year', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  describe('performGeneration', () => {
    it('should generate a palette with keys', () => {
      component.baseColorHex.set('#3b82f6');
      component.saturation.set(100);
      component.lightness.set(50);
      component.performGeneration();

      const palette = component.generatedPalette();
      expect(palette).toBeTruthy();
      const keys = component.getPaletteKeys(palette);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys as any).toContain(50);
      expect(keys as any).toContain(100);
    });

    it('should generate recommendations', () => {
      component.performGeneration();
      const recommendations = component.recommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].name).toBeTruthy();
      expect(recommendations[0].hex).toBeTruthy();
    });

    it('should generate Sass code output', () => {
      component.performGeneration();
      const sassCode = component.sassCodeOutput();
      expect(sassCode).toBeTruthy();
      expect(sassCode).toContain('$');
    });
  });

  describe('onColorInputChange', () => {
    it('should update baseColorHex from color input event', () => {
      const event = { target: { value: '#ff0000' } } as unknown as Event;
      component.onColorInputChange(event);
      expect(component.baseColorHex().toLowerCase()).toBe('#ff0000');
    });
  });

  describe('onHexInputChanged', () => {
    it('should accept a valid 6-digit hex', () => {
      component.onHexInputChanged('#ff5500');
      expect(component.baseColorHex().toLowerCase()).toBe('#ff5500');
    });

    it('should accept a valid 3-digit hex and expand it', () => {
      component.onHexInputChanged('#f00');
      expect(component.baseColorHex().toLowerCase()).toBe('#ff0000');
    });

    it('should prepend # if missing', () => {
      component.onHexInputChanged('ff5500');
      expect(component.baseColorHex().toLowerCase()).toBe('#ff5500');
    });

    it('should not update for invalid hex', () => {
      const previous = component.baseColorHex();
      component.onHexInputChanged('xyz');
      expect(component.baseColorHex()).toBe(previous);
    });
  });

  describe('onSaturationSliderChange', () => {
    it('should update saturation value', () => {
      component.onSaturationSliderChange(75);
      expect(component.saturation()).toBe(75);
    });
  });

  describe('onLightnessSliderChange', () => {
    it('should update lightness value', () => {
      component.onLightnessSliderChange(30);
      expect(component.lightness()).toBe(30);
    });
  });

  describe('onRecommendationClick', () => {
    it('should update base color from recommendation', () => {
      const rec = { name: 'Test', hex: '#00ff00' };
      component.onRecommendationClick(rec);
      expect(component.baseColorHex().toLowerCase()).toBe('#00ff00');
    });
  });

  describe('getPaletteKeys', () => {
    it('should return sorted numeric keys', () => {
      const palette = {
        '500': '#3b82f6',
        '100': '#dbeafe',
        '900': '#1e3a5f',
        '50': '#eff6ff'
      };
      const keys = component.getPaletteKeys(palette);
      expect(keys).toEqual([50, 100, 500, 900]);
    });

    it('should return empty array for empty palette', () => {
      const keys = component.getPaletteKeys({});
      expect(keys).toEqual([]);
    });
  });

  describe('getTextColor', () => {
    it('should return dark text for light backgrounds', () => {
      expect(component.getTextColor('#ffffff')).toBe('#333');
    });

    it('should return light text for dark backgrounds', () => {
      expect(component.getTextColor('#000000')).toBe('#fff');
    });

    it('should handle mid-tone colors', () => {
      const result = component.getTextColor('#888888');
      expect(result === '#333' || result === '#fff').toBe(true);
    });
  });

  describe('showMessage', () => {
    it('should set and clear message after timeout', async () => {
      vi.useFakeTimers();
      component.showMessage('Test message', 'success');
      expect(component.message()).toEqual({ text: 'Test message', type: 'success' });

      vi.advanceTimersByTime(3100);
      expect(component.message()).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('copyTextToClipboard', () => {
    it('should call navigator.clipboard.writeText', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
      component.copyTextToClipboard('#ff0000', 'Copied!');
      expect(writeTextSpy).toHaveBeenCalledWith('#ff0000');
    });
  });

  describe('copyCode', () => {
    it('should copy sass code to clipboard', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
      component.sassCodeOutput.set('$palette: (...)');
      component.copyCode();
      expect(writeTextSpy).toHaveBeenCalledWith('$palette: (...)');
    });
  });

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.removeItem('colorPaletteState');
    });

    it('should save color state to localStorage', () => {
      component.baseColorHex.set('#abcdef');
      component.saturation.set(80);
      component.lightness.set(60);

      component['saveColorStateToLocalStorage']();

      const stored = localStorage.getItem('colorPaletteState');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.baseColorHex).toBe('#abcdef');
      expect(parsed.saturation).toBe(80);
      expect(parsed.lightness).toBe(60);
    });

    it('should load color state from localStorage', () => {
      localStorage.setItem('colorPaletteState', JSON.stringify({
        baseColorHex: '#123456',
        saturation: 90,
        lightness: 40
      }));

      component['loadColorStateFromLocalStorage']();

      expect(component.baseColorHex()).toBe('#123456');
      expect(component.saturation()).toBe(90);
      expect(component.lightness()).toBe(40);
    });

    it('should handle corrupted localStorage data without throwing', () => {
      localStorage.setItem('colorPaletteState', 'not-valid-json');
      expect(() => component['loadColorStateFromLocalStorage']()).not.toThrow();
    });

    afterEach(() => {
      localStorage.removeItem('colorPaletteState');
    });
  });

  describe('autoSave', () => {
    it('should toggle autoSave state', () => {
      expect(component.autoSave()).toBe(false);
      component.autoSave.set(true);
      expect(component.autoSave()).toBe(true);
    });
  });
});
