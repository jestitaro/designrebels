import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

interface Tenant {
  tenancyCodeName: string;
  tenantName: string;
  edition: string;
  subsEndDate: string | null;
  active: boolean;
}

interface AdvancedSearchFilters {
  tenancyCodeName: string;
  tenantName: string;
  edition: string | null;
  active: string | null;
}

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    MenuModule,
    OverlayPanelModule,
    PaginatorModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './tenants-list.component.html',
  styleUrl: './tenants-list.component.scss',
})
export class TenantsListComponent {
  searchTerm = '';

  editions = [
    { label: 'Standard', value: 'Standard' },
    { label: 'Premium', value: 'Premium' },
  ];

  activeOptions = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
  ];

  filters: AdvancedSearchFilters = {
    tenancyCodeName: '',
    tenantName: '',
    edition: null,
    active: null,
  };

  tenants: Tenant[] = [
    { tenancyCodeName: 'Default', tenantName: 'Default', edition: 'Standard', subsEndDate: null, active: true },
    { tenancyCodeName: 'unilever-test-ar-zero', tenantName: 'unilever-test-ar-zero', edition: 'Standard', subsEndDate: null, active: true },
    { tenancyCodeName: 'unilever-test-ar-zero', tenantName: 'unilever-test-ar-zero', edition: 'Standard', subsEndDate: null, active: true },
    { tenancyCodeName: 'unilever-test-ar-zero', tenantName: 'unilever-test-ar-zero', edition: 'Standard', subsEndDate: null, active: true },
  ];

  rowActions: MenuItem[] = [
    { label: 'Exportación a excel', icon: 'pi pi-file-excel' },
    { label: 'Descargar', icon: 'pi pi-download' },
    { label: 'Importar', icon: 'pi pi-upload' },
    { label: 'Compartir', icon: 'pi pi-share-alt' },
  ];

  openAdvancedSearch(event: Event, panel: OverlayPanel): void {
    panel.show(event);
  }

  onSearch(panel?: OverlayPanel): void {
    panel?.hide();
  }

  clearFilters(): void {
    this.filters = {
      tenancyCodeName: '',
      tenantName: '',
      edition: null,
      active: null,
    };
    this.searchTerm = '';
  }
}
