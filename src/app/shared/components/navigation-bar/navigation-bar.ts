import { Component, inject, Input } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UiService } from '../../../core/services/ui-service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation-bar',
  imports: [MatInputModule, MatIconModule, MatButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './navigation-bar.html',
  styleUrl: './navigation-bar.scss'
})
export class NavigationBar {
  protected uiService = inject(UiService)
  @Input() applicationName: string = '';

  toggleMode() {
    this.uiService.toggleMode();
  }

}
