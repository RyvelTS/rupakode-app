/**
 * @fileoverview Component for generating and displaying Material Design-like color palettes.
 *
 * It includes features for selecting a base color, adjusting saturation and lightness,
 * viewing color recommendations, generating Sass/SCSS code, and copying the generated code to the clipboard.
 *
 * Preferred use: Applied to a template for interactive color scheme creation.
 */
import { Component, OnInit, ViewChild, ElementRef, signal, effect, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-color-palette',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSliderModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './color-palette.html',
  styleUrl: './color-palette.scss'
})
export class ColorPalette implements OnInit {
  appName = environment.appName;
  readonly currentYear: number = new Date().getFullYear();
  baseColorHex = signal<string>('#3b82f6');
  saturation = signal<number>(100);
  lightness = signal<number>(50);
  autoSave = signal<boolean>(false);

  generatedPalette = signal<any>({});
  recommendations = signal<any[]>([]);
  sassCodeOutput = signal<string>('/* Palet belum dihasilkan */');

  message = signal<{ text: string, type: string } | null>(null);
  @ViewChild('codeOutput') codeOutputRef!: ElementRef<HTMLPreElement>;
  @ViewChild('messageBox') messageBoxRef!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      if (this.baseColorHex() && this.saturation() !== null && this.lightness() !== null) {
        this.performGeneration();
        if (this.autoSave()) this.saveColorStateToLocalStorage();
      }
    });
  }

  ngOnInit(): void {
    this.loadColorStateFromLocalStorage();
  }

  /**
   * Helper function to convert a hex color string to an RGB object.
   * Supports shorthand hex codes (e.g., #F00) and full hex codes (e.g., #FF0000).
   * @param hex - The hex color string (e.g., "#RRGGBB" or "RRGGBB").
   * @returns An object with r, g, b properties, or null if conversion fails.
   */
  private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Helper function to convert an RGB color to an HSL object.
   * RGB values are expected to be between 0 and 255.
   * @param r - Red component (0-255).
   * @param g - Green component (0-255).
   * @param b - Blue component (0-255).
   * @returns An object with h (hue 0-1), s (saturation 0-1), l (lightness 0-1) properties.
   */
  private rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number = 0;
    let s: number = 0;
    let l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h, s: s, l: l };
  }

  /**
   * Helper function for HSL to RGB conversion.
   * Converts a hue value to an RGB component.
   * @param p - intermediate value for calculation.
   * @param q - intermediate value for calculation.
   * @param t - hue value (0-1).
   * @returns RGB component (0-1).
   */
  private hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  /**
   * Helper function to convert an HSL color to an RGB object.
   * HSL values are expected to be between 0 and 1.
   * @param h - Hue (0-1).
   * @param s - Saturation (0-1).
   * @param l - Lightness (0-1).
   * @returns An object with r, g, b properties (0-255).
   */
  private hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this.hue2rgb(p, q, h + 1 / 3);
      g = this.hue2rgb(p, q, h);
      b = this.hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Helper function to convert an RGB color to a hex string.
   * RGB values are expected to be between 0 and 255.
   * @param r - Red component (0-255).
   * @param g - Green component (0-255).
   * @param b - Blue component (0-255).
   * @returns A hex color string (e.g., "#RRGGBB").
   */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Generates a Material Design-like color palette based on a base hex color, target saturation, and target lightness.
   * The palette includes various shades from 0 to 100, interpolating lightness and maintaining hue/saturation.
   * @param baseHex - The base color in hex format (e.g., "#3b82f6").
   * @param targetSaturation - The desired saturation for the palette (0-100).
   * @param targetLightness - The desired lightness for the palette (0-100).
   * @returns An object representing the color palette, where keys are shade steps and values are hex codes.
   */
  private generateMaterialPalette(baseHex: string, targetSaturation: number, targetLightness: number): any {
    const baseRgb = this.hexToRgb(baseHex);
    if (!baseRgb) return {};
    const baseHsl = this.rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

    const palette: { [key: number]: string } = {};
    const effectiveHsl = {
      h: baseHsl.h,
      s: targetSaturation / 100,
      l: targetLightness / 100
    };

    const steps = [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100];
    const primarySteps = [4, 6, 12, 17, 22, 24, 87, 92, 94, 96];
    steps.forEach(step => {
      let l_adjusted: number;

      if (step <= 50) {
        l_adjusted = effectiveHsl.l * (step / 50);
      } else {
        l_adjusted = effectiveHsl.l + (1 - effectiveHsl.l) * ((step - 50) / 50);
      }
      l_adjusted = Math.max(0, Math.min(1, l_adjusted));


      let s_adjusted = effectiveHsl.s;

      const rgb = this.hslToRgb(effectiveHsl.h, s_adjusted, l_adjusted);
      palette[step] = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    primarySteps.forEach(step => {
      if (!palette[step]) {
        let l_adjusted: number;
        if (step <= 50) {
          l_adjusted = effectiveHsl.l * (step / 50);
        } else {
          l_adjusted = effectiveHsl.l + (1 - effectiveHsl.l) * ((step - 50) / 50);
        }
        l_adjusted = Math.max(0, Math.min(1, l_adjusted));
        const rgb = this.hslToRgb(effectiveHsl.h, effectiveHsl.s, l_adjusted);
        palette[step] = this.rgbToHex(rgb.r, rgb.g, rgb.b);
      }
    });

    const sortedPalette: { [key: number]: string } = {};
    Object.keys(palette).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
      sortedPalette[parseInt(key)] = palette[parseInt(key)];
    });

    return sortedPalette;
  }

  /**
   * Helper function to get a representative shade from a color palette.
   * Tries to get the preferred key (e.g., 50), otherwise finds the closest or middle key.
   * @param palette - The color palette object.
   * @param preferredKey - The preferred numerical key (e.g., 50, 95, 10).
   * @returns The hex color string for the representative shade.
   */
  private getRepresentativeShade(palette: any, preferredKey: number = 50): string {
    if (palette[preferredKey]) {
      return palette[preferredKey];
    }
    const sortedKeys = Object.keys(palette).map(Number).sort((a, b) => a - b);
    if (sortedKeys.length > 0) {

      const closestKey = sortedKeys.reduce((prev, curr) => (
        Math.abs(curr - preferredKey) < Math.abs(prev - preferredKey) ? curr : prev
      ));
      return palette[closestKey];
    }
    return '#000000';
  }

  /**
   * Generates color recommendations based on the generated palettes and the base HSL color.
   * This function ensures recommendations are consistent with the overall palette generation.
   * @param primaryPalette - The generated primary color palette.
   * @param secondaryPalette - The generated secondary color palette.
   * @param tertiaryPalette - The generated tertiary color palette.
   * @param neutralPalette - The generated neutral color palette.
   * @param neutralVariantPalette - The generated neutral variant color palette.
   * @param errorPalette - The generated error color palette.
   * @param baseHsl - The HSL object of the original base color.
   * @param currentSaturation - The current saturation value from the slider (0-100).
   * @param currentLightness - The current lightness value from the slider (0-100).
   * @returns An array of recommended color objects (name, hex).
   */
  private generateRecommendations(
    primaryPalette: any,
    secondaryPalette: any,
    tertiaryPalette: any,
    neutralPalette: any,
    neutralVariantPalette: any,
    errorPalette: any,
    baseHsl: { h: number, s: number, l: number },
    currentSaturation: number,
    currentLightness: number
  ): any[] {
    const recommendations = [];
    recommendations.push({
      name: "Warna Utama",
      hex: this.getRepresentativeShade(primaryPalette, 50)
    });

    recommendations.push({
      name: "Warna Sekunder",
      hex: this.getRepresentativeShade(secondaryPalette, 50)
    });

    recommendations.push({
      name: "Warna Tersier",
      hex: this.getRepresentativeShade(tertiaryPalette, 50)
    });

    recommendations.push({
      name: "Warna Netral (Terang)",
      hex: this.getRepresentativeShade(neutralPalette, 95)
    });

    recommendations.push({
      name: "Warna Netral (Gelap)",
      hex: this.getRepresentativeShade(neutralVariantPalette, 10)
    });

    const complementaryHue = (baseHsl.h + 0.5) % 1;
    const compRgb = this.hslToRgb(complementaryHue, currentSaturation / 100, currentLightness / 100);
    recommendations.push({
      name: "Warna Komplementer",
      hex: this.rgbToHex(compRgb.r, compRgb.g, compRgb.b)
    });

    const accentHue = (baseHsl.h * 360 + 300) % 360 / 360;
    const accentSaturation = Math.min(1, (currentSaturation / 100) * 1.2);
    const accentLightness = Math.max(0.2, Math.min(0.8, (currentLightness / 100) * 0.9));
    const accentRgb = this.hslToRgb(accentHue, accentSaturation, accentLightness);
    recommendations.push({
      name: "Warna Aksen",
      hex: this.rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b)
    });

    recommendations.push({
      name: "Warna Error",
      hex: this.getRepresentativeShade(errorPalette, 60)
    });

    return recommendations;
  }

  /**
   * Generates the Sass/SCSS code for the color palettes.
   * @param primaryPalette - The primary color palette.
   * @param secondaryPalette - The secondary color palette.
   * @param tertiaryPalette - The tertiary color palette.
   * @param neutralPalette - The neutral color palette.
   * @param neutralVariantPalette - The neutral variant color palette.
   * @param errorPalette - The error color palette.
   * @returns A string containing the formatted Sass/SCSS map.
   */
  private generateSassCode(primaryPalette: any, secondaryPalette: any, tertiaryPalette: any, neutralPalette: any, neutralVariantPalette: any, errorPalette: any): string {
    let sassCode = `$palettes: (\n`;

    const formatPalette = (name: string, pal: any) => {
      let content = `  ${name}: (\n`;
      const sortedKeys = Object.keys(pal).sort((a, b) => parseInt(a) - parseInt(b));
      sortedKeys.forEach((key, index) => {
        content += `    ${key}: ${pal[parseInt(key)]}${index === sortedKeys.length - 1 ? '' : ','}\n`;
      });
      content += '  ),\n';
      return content;
    };

    sassCode += formatPalette('primary', primaryPalette);
    sassCode += formatPalette('secondary', secondaryPalette);
    sassCode += formatPalette('tertiary', tertiaryPalette);
    sassCode += formatPalette('neutral', neutralPalette);
    sassCode += formatPalette('neutral-variant', neutralVariantPalette);
    sassCode += formatPalette('error', errorPalette);
    sassCode += `);\n`;

    return sassCode;
  }

  /**
   * Performs the main color palette and recommendation generation.
   * This function is triggered by changes in base color, saturation, or lightness.
   */
  performGeneration(): void {
    const baseHex = this.baseColorHex();
    const currentSaturation = this.saturation();
    const currentLightness = this.lightness();
    if (!baseHex || !/^#[0-9A-Fa-f]{6}$/.test(baseHex)) {
      this.showMessage('Harap masukkan warna dasar HEX yang valid (contoh: #3B82F6).', 'error');
      return;
    }

    const baseRgb = this.hexToRgb(baseHex);
    if (!baseRgb) {
      this.showMessage('Gagal mengurai warna HEX dasar.', 'error');
      return;
    }

    const baseHsl = this.rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
    const primaryPalette = this.generateMaterialPalette(baseHex, currentSaturation, currentLightness);

    const secondaryHue = (baseHsl.h * 360 + 60) % 360 / 360;
    const secondaryBaseHex = this.rgbToHex(this.hslToRgb(secondaryHue, currentSaturation / 100, currentLightness / 100).r, this.hslToRgb(secondaryHue, currentSaturation / 100, currentLightness / 100).g, this.hslToRgb(secondaryHue, currentSaturation / 100, currentLightness / 100).b);
    const secondaryPalette = this.generateMaterialPalette(secondaryBaseHex, currentSaturation, currentLightness);

    const tertiaryHue = (baseHsl.h * 360 + 120) % 360 / 360;
    const tertiaryBaseHex = this.rgbToHex(this.hslToRgb(tertiaryHue, currentSaturation / 100, currentLightness / 100).r, this.hslToRgb(tertiaryHue, currentSaturation / 100, currentLightness / 100).g, this.hslToRgb(tertiaryHue, currentSaturation / 100, currentLightness / 100).b);
    const tertiaryPalette = this.generateMaterialPalette(tertiaryBaseHex, currentSaturation, currentLightness);

    const neutralBaseHex = this.rgbToHex(this.hslToRgb(baseHsl.h, 0.15, 0.60).r, this.hslToRgb(baseHsl.h, 0.15, 0.60).g, this.hslToRgb(baseHsl.h, 0.15, 0.60).b);
    const neutralPalette = this.generateMaterialPalette(neutralBaseHex, 15, 60);
    const neutralVariantBaseHex = this.rgbToHex(this.hslToRgb(baseHsl.h, 0.20, 0.45).r, this.hslToRgb(baseHsl.h, 0.20, 0.45).g, this.hslToRgb(baseHsl.h, 0.20, 0.45).b);
    const neutralVariantPalette = this.generateMaterialPalette(neutralVariantBaseHex, 20, 45);
    const errorPalette = this.generateMaterialPalette("#B00020", 80, 55);

    this.generatedPalette.set(primaryPalette);
    this.recommendations.set(this.generateRecommendations(
      primaryPalette,
      secondaryPalette,
      tertiaryPalette,
      neutralPalette,
      neutralVariantPalette,
      errorPalette,
      baseHsl,
      currentSaturation,
      currentLightness
    ));

    this.sassCodeOutput.set(this.generateSassCode(primaryPalette, secondaryPalette, tertiaryPalette, neutralPalette, neutralVariantPalette, errorPalette));
    this.showMessage('Palet warna dan rekomendasi berhasil dihasilkan!', 'success');
  }

  /**
   * Handles changes from the color input field (e.g., HTML5 color picker).
   * Updates the base color signal.
   * @param event - The input change event.
   */
  onColorInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.baseColorHex.set(value.toUpperCase());
  }

  /**
   * Handles changes from the manual hex input field.
   * Validates and formats the hex string, then updates the base color signal.
   * @param value - The raw input string from the hex field.
   */
  onHexInputChanged(value: string): void {
    const cleanedHex = value.startsWith('#') ? value.substring(1) : value;
    let finalHex = '';
    if (/^[0-9A-Fa-f]{6}$/.test(cleanedHex)) {
      finalHex = '#' + cleanedHex;
    }

    else if (/^[0-9A-Fa-f]{3}$/.test(cleanedHex)) {
      finalHex = '#' + cleanedHex[0] + cleanedHex[0] + cleanedHex[1] + cleanedHex[1] + cleanedHex[2] + cleanedHex[2];
    } else {
      return;
    }

    this.baseColorHex.set(finalHex.toUpperCase());
  }

  /**
   * Handles changes from the saturation slider.
   * Updates the saturation signal and adjusts the base color hex to reflect the new saturation.
   * @param value - The new saturation value (0-100).
   */
  onSaturationSliderChange(value: number): void {
    this.saturation.set(value);

    const currentRgb = this.hexToRgb(this.baseColorHex());
    if (currentRgb) {
      const currentHsl = this.rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
      const newRgb = this.hslToRgb(currentHsl.h, value / 100, currentHsl.l);
      const newHex = this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      this.baseColorHex.set(newHex.toUpperCase());
    }
  }

  /**
   * Handles changes from the lightness slider.
   * Updates the lightness signal and adjusts the base color hex to reflect the new lightness.
   * @param value - The new lightness value (0-100).
   */
  onLightnessSliderChange(value: number): void {
    this.lightness.set(value);

    const currentRgb = this.hexToRgb(this.baseColorHex());
    if (currentRgb) {
      const currentHsl = this.rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
      const newRgb = this.hslToRgb(currentHsl.h, currentHsl.s, value / 100);
      const newHex = this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      this.baseColorHex.set(newHex.toUpperCase());
    }
  }

  /**
   * Handles clicks on a recommended color.
   * Sets the recommended color as the new base color and updates saturation/lightness sliders.
   * @param rec - The recommended color object.
   */
  onRecommendationClick(rec: any): void {
    this.baseColorHex.set(rec.hex.toUpperCase());
    const newRgb = this.hexToRgb(rec.hex);
    if (!newRgb) return;
    const newHsl = this.rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    this.saturation.set(Math.round(newHsl.s * 100));
    this.lightness.set(Math.round(newHsl.l * 100));

    this.showMessage(`Menggunakan warna ${rec.name} sebagai warna dasar baru.`, 'info');
  }

  /**
   * Displays a temporary message to the user.
   * @param text - The message text.
   * @param type - The type of message (e.g., 'success', 'error', 'info').
   */
  showMessage(text: string, type: string = 'success'): void {
    this.message.set({ text, type });
    setTimeout(() => {
      this.message.set(null);
    }, 3000);
  }

  /**
   * Copies the generated Sass/SCSS code to the clipboard.
   */
  copyCode(): void {
    this.copyTextToClipboard(this.sassCodeOutput(), 'Kode palet Sass/SCSS berhasil disalin!');
  }

  /**
   * Generic function to copy text to the clipboard.
   * @param text - The text to copy.
   * @param successMessage - The message to show on successful copy.
   */
  copyTextToClipboard(text: string, successMessage: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => this.showMessage(successMessage, 'success'))
        .catch(err => {
          console.error('Gagal menyalin: ', err);
          this.showMessage('Gagal menyalin teks.', 'error');
        });
    } else {
      this.showMessage('Browser Anda tidak mendukung penyalinan ke clipboard secara langsung.', 'error');
    }
  }

  /**
   * Returns sorted numerical keys of a palette object.
   * @param palette - The color palette object.
   * @returns An array of sorted numerical keys.
   */
  getPaletteKeys(palette: any): number[] {
    return Object.keys(palette).map(key => parseInt(key)).sort((a, b) => a - b);
  }

  /**
   * Determines the best text color (black or white) for a given background hex color
   * to ensure good contrast based on luminance.
   * @param hex - The background hex color string.
   * @returns '#333' for light backgrounds, '#fff' for dark backgrounds.
   */
  getTextColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return '#333';

    const luminance = (0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255));
    return luminance > 0.5 ? '#333' : '#fff';
  }

  /**
   * Saves the current color state (base hex, saturation, lightness) to local storage.
   */
  protected saveColorStateToLocalStorage(): void {
    try {
      const colorState = {
        baseColorHex: this.baseColorHex(),
        saturation: this.saturation(),
        lightness: this.lightness()
      };
      localStorage.setItem('colorPaletteState', JSON.stringify(colorState));
      this.showMessage('Status warna berhasil di simpan di local storage.', 'info');
    } catch (e) {
      console.error('Gagal menyimpan status warna ke local storage:', e);
    }
  }

  /**
   * Loads the color state from local storage and applies it to the signals.
   * If no state is found, it uses the default initial values.
   */
  private loadColorStateFromLocalStorage(): void {
    try {
      const savedState = localStorage.getItem('colorPaletteState');
      if (savedState) {
        const colorState = JSON.parse(savedState);

        if (colorState && typeof colorState.baseColorHex === 'string' &&
          typeof colorState.saturation === 'number' && typeof colorState.lightness === 'number') {
          this.baseColorHex.set(colorState.baseColorHex);
          this.saturation.set(colorState.saturation);
          this.lightness.set(colorState.lightness);
          this.showMessage('Status warna dimuat dari local storage.', 'info');
        } else {
          console.warn('Data status warna di local storage rusak atau tidak lengkap.');
        }
      }
    } catch (e) {
      console.error('Gagal memuat status warna dari local storage:', e);
    }
  }
}
