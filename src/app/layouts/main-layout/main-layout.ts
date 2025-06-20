import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationBar } from '../../shared/components/navigation-bar/navigation-bar';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NavigationBar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  protected readonly APP_NAME = environment.appName;
  readonly currentYear: number = new Date().getFullYear();
}
