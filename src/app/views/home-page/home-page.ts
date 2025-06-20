import { Component } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [MatIconModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {
  appName = environment.appName
}
