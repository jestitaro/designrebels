import { Component } from '@angular/core';
import { TenantsListComponent } from './tenants-list/tenants-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TenantsListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'tenants-abm';
}
