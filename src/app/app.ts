import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiService } from './core/services/ui-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'rupakode-app';
  private uiService = inject(UiService)

  ngOnInit(): void {
    this.uiService.initializeTheme();
  }
}
