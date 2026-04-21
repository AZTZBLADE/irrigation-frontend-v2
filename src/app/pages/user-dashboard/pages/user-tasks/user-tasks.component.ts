import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import {
  TaskService,
  Task,
  TaskStatus,
  GeoJsonFeature,
} from '../../../../core/task.service';

type UiTab = 'ongoing' | 'terminated';
type ViewMode = 'cards' | 'table';
type DateSort = 'newest' | 'oldest';

@Component({
  selector: 'app-user-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-tasks.component.html',
  styleUrl: './user-tasks.component.scss',
})
export class UserTasksComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private L: any = null;

  map: any = null;
  loading = false;
  error = '';

  tasks: Task[] = [];
  insightsMap: Record<number, any> = {};
  globalInsights: any = null;

  activeTab: UiTab = 'ongoing';
  viewMode: ViewMode = 'cards';
  dateSort: DateSort = 'newest';

  searchTerm = '';

  showModal = false;
  editingTaskId: number | null = null;
  editingOriginalTask: Task | null = null;

  showMapModal = false;

  parcelGeoJson: GeoJsonFeature | undefined = undefined;
  subParcelsGeoJson: GeoJsonFeature[] = [];

  soilProfiles: string[] = ['SANDY', 'LOAMY', 'CLAYEY', 'SILTY'];

  cropCategories = [
    {
      label: 'Vegetables',
      items: [
        'Tomato',
        'Potato',
        'Pepper',
        'Onion',
        'Carrot',
        'Lettuce',
        'Cucumber',
      ],
    },
    {
      label: 'Cereals',
      items: ['Corn', 'Wheat', 'Barley', 'Oats', 'Rice', 'Sorghum'],
    },
  ];

  filteredCropCategories: { label: string; items: string[] }[] = [];
  showCropSuggestions = false;

  private intervalId: any;
  private updatingTaskIds = new Set<number>();

  selectionRect: any = null;
  startLatLng: any = null;
  savedLayers: any[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    location: ['', Validators.required],
    plantingDate: ['', Validators.required],
    duration: [60, [Validators.required, Validators.min(1)]],
    crop: ['', Validators.required],
    soilProfile: ['', Validators.required],
    waterAmount: [1200, [Validators.required, Validators.min(0)]],
    debit: [20, [Validators.required, Validators.min(0)]],
    parcel: [undefined as GeoJsonFeature | undefined],
    subParcels: [[] as GeoJsonFeature[]],
  });

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadGlobalInsights();

    this.intervalId = setInterval(() => {
      this.syncTasksWithTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);

    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  }

  private normalizeStatus(status: any): TaskStatus {
    const value = String(status || '').toLowerCase();

    if (value === 'terminated' || value === 'completed' || value === 'done') {
      return 'terminated';
    }

    return 'ongoing';
  }

  private getNowLocalDateTimeString(): string {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  private parseTaskStartTime(startTime?: string | null): number | null {
    if (!startTime) return null;

    const parsed = new Date(startTime).getTime();
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return null;

    return parsed;
  }

  loadTasks(): void {
    this.loading = true;
    this.error = '';

    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = (data || []).map((task) => ({
          ...task,
          surface: Number(task.surface || 0),
          duration: Number(task.duration || 0),
          waterAmount: Number(task.waterAmount || 0),
          debit: Number(task.debit || 0),
          status: this.normalizeStatus(task.status),
          subParcels: task.subParcels || [],
          parcel: task.parcel || undefined,
        }));

        this.loading = false;
        this.syncTasksWithTime();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load tasks';
        this.loading = false;
      },
    });
  }

  loadGlobalInsights(): void {
    this.taskService.getAutomatedInsights().subscribe({
      next: (res: any[]) => {
        this.globalInsights = res;

        if (Array.isArray(res)) {
          res.forEach((insight: any) => {
            if (insight.taskId) {
              this.insightsMap[insight.taskId] = insight;
            }
          });
        }
      },
      error: () => {
        this.globalInsights = null;
      },
    });
  }

  refreshSingleInsight(taskId: number): void {
    this.taskService.getTaskWeatherInsight(taskId).subscribe({
      next: (res) => {
        this.insightsMap[taskId] = res;
      },
      error: () => {},
    });
  }

  getInsight(taskId?: number): any | null {
    if (!taskId) return null;
    return this.insightsMap[taskId] || null;
  }

  setTab(tab: UiTab): void {
    this.activeTab = tab;
  }

  setView(mode: ViewMode): void {
    this.viewMode = mode;
  }

  setDateSort(sort: DateSort): void {
    this.dateSort = sort;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  onCropInput(event: Event): void {
    const value =
      (event.target as HTMLInputElement).value?.trim().toLowerCase() || '';

    if (!value) {
      this.filteredCropCategories = [];
      this.showCropSuggestions = false;
      return;
    }

    this.filteredCropCategories = this.cropCategories
      .map((category) => ({
        label: category.label,
        items: category.items.filter((item) =>
          item.toLowerCase().includes(value)
        ),
      }))
      .filter((category) => category.items.length > 0);

    this.showCropSuggestions = this.filteredCropCategories.length > 0;
  }

  selectCrop(crop: string): void {
    this.form.patchValue({ crop });
    this.filteredCropCategories = [];
    this.showCropSuggestions = false;
  }

  hideCropSuggestions(): void {
    setTimeout(() => {
      this.showCropSuggestions = false;
    }, 150);
  }

  get filteredTasks(): Task[] {
    const filtered = this.tasks.filter((task) => {
      const statusOk = this.normalizeStatus(task.status) === this.activeTab;
      const search = this.searchTerm.trim().toLowerCase();

      const searchOk =
        !search ||
        task.name.toLowerCase().includes(search) ||
        task.location.toLowerCase().includes(search) ||
        task.crop.toLowerCase().includes(search) ||
        (task.soilProfile || '').toLowerCase().includes(search);

      return statusOk && searchOk;
    });

    return filtered.sort((a, b) => {
      const dateA = this.parseTaskStartTime(a.startTime) || 0;
      const dateB = this.parseTaskStartTime(b.startTime) || 0;
      return this.dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }

  get ongoingCount(): number {
    return this.tasks.filter((t) => this.normalizeStatus(t.status) === 'ongoing')
      .length;
  }

  get terminatedCount(): number {
    return this.tasks.filter((t) => this.normalizeStatus(t.status) === 'terminated')
      .length;
  }

  openModal(): void {
    this.editingTaskId = null;
    this.editingOriginalTask = null;
    this.error = '';

    this.parcelGeoJson = undefined;
    this.subParcelsGeoJson = [];
    this.savedLayers = [];
    this.filteredCropCategories = [];
    this.showCropSuggestions = false;

    this.form.reset({
      name: '',
      location: '',
      plantingDate: '',
      duration: 60,
      crop: '',
      soilProfile: '',
      waterAmount: 1200,
      debit: 20,
      parcel: undefined,
      subParcels: [],
    });

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTaskId = null;
    this.editingOriginalTask = null;
    this.showCropSuggestions = false;
  }

  editTask(task: Task): void {
    this.editingTaskId = task.id ?? null;
    this.editingOriginalTask = { ...task };
    this.error = '';
    this.filteredCropCategories = [];
    this.showCropSuggestions = false;

    this.parcelGeoJson = task.parcel || undefined;
    this.subParcelsGeoJson = [...(task.subParcels || [])];

    this.form.patchValue({
      name: task.name,
      location: task.location,
      plantingDate: task.plantingDate || '',
      duration: Number(task.duration || 0),
      crop: task.crop,
      soilProfile: task.soilProfile || '',
      waterAmount: Number(task.waterAmount || 0),
      debit: Number(task.debit || 0),
      parcel: task.parcel || undefined,
      subParcels: task.subParcels || [],
    });

    this.showModal = true;
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const raw = this.form.getRawValue();

    const finalParcel =
      raw.parcel || this.parcelGeoJson || this.editingOriginalTask?.parcel;

    const finalSubParcels =
      raw.subParcels?.length
        ? raw.subParcels
        : this.subParcelsGeoJson?.length
        ? this.subParcelsGeoJson
        : this.editingOriginalTask?.subParcels || [];

    const computedSurface = this.getComputedSurface(
      finalParcel,
      finalSubParcels
    );

    const payload: Task = {
      name: raw.name || '',
      location: raw.location || this.editingOriginalTask?.location || '',
      surface: computedSurface,
      startTime:
        this.editingOriginalTask?.startTime || this.getNowLocalDateTimeString(),
      plantingDate: raw.plantingDate || '',
      duration: Number(raw.duration || 0),
      crop: raw.crop || '',
      soilProfile: raw.soilProfile || '',
      waterAmount: Number(raw.waterAmount || 0),
      debit: Number(raw.debit || 0),
      status:
        this.editingOriginalTask?.status &&
        this.normalizeStatus(this.editingOriginalTask.status) === 'terminated'
          ? 'terminated'
          : 'ongoing',
      parcel: finalParcel,
      subParcels: finalSubParcels,
    };

    if (this.editingTaskId !== null) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadTasks();
          this.loadGlobalInsights();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Update failed';
          this.loading = false;
        },
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadTasks();
          this.loadGlobalInsights();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Create failed';
          this.loading = false;
        },
      });
    }
  }

  deleteTask(task: Task): void {
    if (!task.id) return;
    if (!confirm('Delete this task ?')) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
        delete this.insightsMap[task.id!];
      },
      error: (err) => {
        console.error(err);
        this.error = 'Delete failed';
      },
    });
  }

  markAsTerminated(task: Task): void {
    if (!task.id) return;
    if (this.updatingTaskIds.has(task.id)) return;

    this.updatingTaskIds.add(task.id);

    const updated: Task = { ...task, status: 'terminated' };

    this.taskService.updateTask(task.id, updated).subscribe({
      next: () => {
        task.status = 'terminated';
        this.updatingTaskIds.delete(task.id!);
      },
      error: () => {
        this.updatingTaskIds.delete(task.id!);
      },
    });
  }

  async openMapModal(): Promise<void> {
    this.showMapModal = true;

    if (!this.isBrowser) return;

    setTimeout(async () => {
      await this.initMap();

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(true);
          this.loadMapFromExistingGeometry();
        }
      }, 400);
    }, 150);
  }

  closeMapModal(): void {
    this.showMapModal = false;

    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }

    this.selectionRect = null;
    this.startLatLng = null;
  }

  confirmMapLocation(): void {
    if (!this.parcelGeoJson) {
      alert('Draw the main parcel first.');
      return;
    }

    const computedSurface = this.getComputedSurface(
      this.parcelGeoJson,
      this.subParcelsGeoJson
    );

    this.form.patchValue({
      location: 'Parcel selected on map',
      parcel: this.parcelGeoJson,
      subParcels: this.subParcelsGeoJson,
    });

    alert(`Parcel saved. Computed surface: ${computedSurface.toFixed(2)} m²`);
    this.closeMapModal();
  }

  async initMap(): Promise<void> {
    if (!this.isBrowser) return;

    if (!this.L) {
      const leaflet = await import('leaflet');
      this.L = leaflet;
    }

    const container = document.getElementById('task-map-modal');
    if (!container) return;

    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }

    container.innerHTML = '';

    this.map = this.L.map(container, {
      center: [36.8065, 10.1815],
      zoom: 13,
      zoomControl: true,
    });

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.installSelectionHandlers();

    setTimeout(() => {
      this.map?.invalidateSize(true);
    }, 300);
  }

  installSelectionHandlers(): void {
    if (!this.map || !this.L) return;

    this.map.on('mousedown', (e: any) => {
      if (e.originalEvent?.button !== 0) return;

      this.startLatLng = e.latlng;

      if (this.selectionRect) {
        this.map.removeLayer(this.selectionRect);
        this.selectionRect = null;
      }

      this.selectionRect = this.L.rectangle(
        [this.startLatLng, this.startLatLng],
        {
          color: '#3b82f6',
          weight: 2,
          fillColor: '#60a5fa',
          fillOpacity: 0.2,
        }
      ).addTo(this.map);

      this.map.dragging.disable();
    });

    this.map.on('mousemove', (e: any) => {
      if (!this.startLatLng || !this.selectionRect) return;

      const bounds = this.L.latLngBounds(this.startLatLng, e.latlng);
      this.selectionRect.setBounds(bounds);
    });

    this.map.on('mouseup', () => {
      if (!this.startLatLng || !this.selectionRect) {
        this.startLatLng = null;
        this.map.dragging.enable();
        return;
      }

      const bounds = this.selectionRect.getBounds();

      if (
        Math.abs(bounds.getNorth() - bounds.getSouth()) < 0.00001 ||
        Math.abs(bounds.getEast() - bounds.getWest()) < 0.00001
      ) {
        this.map.removeLayer(this.selectionRect);
        this.selectionRect = null;
        this.startLatLng = null;
        this.map.dragging.enable();
        return;
      }

      const geo = this.selectionRect.toGeoJSON() as GeoJsonFeature;

      if (!this.parcelGeoJson) {
        this.parcelGeoJson = geo;
        this.selectionRect.setStyle({
          color: '#16a34a',
          fillColor: '#22c55e',
          fillOpacity: 0.18,
          weight: 3,
        });
      } else {
        this.subParcelsGeoJson.push(geo);
        this.selectionRect.setStyle({
          color: '#2563eb',
          fillColor: '#60a5fa',
          fillOpacity: 0.15,
          weight: 2,
        });
      }

      this.savedLayers.push(this.selectionRect);
      this.selectionRect = null;
      this.startLatLng = null;

      this.syncGeometryToForm();
      this.map.dragging.enable();
    });
  }

  loadMapFromExistingGeometry(): void {
    if (!this.map || !this.L) return;

    this.savedLayers.forEach((layer) => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    this.savedLayers = [];

    if (this.selectionRect && this.map.hasLayer(this.selectionRect)) {
      this.map.removeLayer(this.selectionRect);
      this.selectionRect = null;
    }

    if (this.parcelGeoJson) {
      const parcelLayer = this.L.geoJSON(this.parcelGeoJson, {
        style: {
          color: '#16a34a',
          weight: 3,
          fillColor: '#22c55e',
          fillOpacity: 0.18,
        },
      });

      parcelLayer.eachLayer((layer: any) => {
        layer.addTo(this.map);
        this.savedLayers.push(layer);
      });
    }

    if (this.subParcelsGeoJson?.length) {
      this.subParcelsGeoJson.forEach((feature) => {
        const zoneLayer = this.L.geoJSON(feature, {
          style: {
            color: '#2563eb',
            weight: 2,
            fillColor: '#60a5fa',
            fillOpacity: 0.15,
          },
        });

        zoneLayer.eachLayer((layer: any) => {
          layer.addTo(this.map);
          this.savedLayers.push(layer);
        });
      });
    }

    if (this.savedLayers.length > 0) {
      const group = this.L.featureGroup(this.savedLayers);
      this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
  }

  syncGeometryToForm(): void {
    this.form.patchValue({
      parcel: this.parcelGeoJson,
      subParcels: this.subParcelsGeoJson,
    });
  }

  clearMapSelection(): void {
    if (!this.map) return;

    this.savedLayers.forEach((layer) => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    if (this.selectionRect && this.map.hasLayer(this.selectionRect)) {
      this.map.removeLayer(this.selectionRect);
    }

    this.savedLayers = [];
    this.selectionRect = null;
    this.startLatLng = null;

    this.parcelGeoJson = undefined;
    this.subParcelsGeoJson = [];

    this.form.patchValue({
      parcel: undefined,
      subParcels: [],
      location: this.editingOriginalTask?.location || '',
    });
  }

  syncTasksWithTime(): void {
    const now = Date.now();

    this.tasks.forEach((task) => {
      if (this.normalizeStatus(task.status) !== 'ongoing') return;
      if (!task.startTime) return;

      const start = this.parseTaskStartTime(task.startTime);
      const durationMinutes = Number(task.duration || 0);

      if (start === null) return;
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return;

      const end = start + durationMinutes * 60000;

      if (!Number.isFinite(end) || end <= start) return;

      if (now >= end) {
        this.markAsTerminated(task);
      }
    });
  }

  statusLabel(status?: string): string {
    return this.normalizeStatus(status) === 'terminated'
      ? 'Completed'
      : 'In Progress';
  }

  getProgress(task: Task): number {
    if (!task.startTime || !task.duration) return 0;

    const start = this.parseTaskStartTime(task.startTime);
    const durationMinutes = Number(task.duration || 0);

    if (start === null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return 0;
    }

    const end = start + durationMinutes * 60000;
    const now = Date.now();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  }

  getRemainingTime(task: Task): string {
    if (!task.startTime || !task.duration) return '-';

    const start = this.parseTaskStartTime(task.startTime);
    const durationMinutes = Number(task.duration || 0);

    if (start === null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return '-';
    }

    const end = start + durationMinutes * 60000;
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Finished';

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}m ${seconds}s`;
  }

  getComputedSurface(
    parcel?: GeoJsonFeature | null,
    subParcels?: GeoJsonFeature[] | null
  ): number {
    let total = 0;

    const finalParcel = parcel ?? this.parcelGeoJson;
    const finalSubParcels = subParcels ?? this.subParcelsGeoJson;

    if (finalParcel) {
      total += this.computeFeatureAreaInSquareMeters(finalParcel);
    }

    if (finalSubParcels?.length) {
      finalSubParcels.forEach((feature) => {
        total += this.computeFeatureAreaInSquareMeters(feature);
      });
    }

    return Math.round(total * 100) / 100;
  }

  private computeFeatureAreaInSquareMeters(feature: GeoJsonFeature): number {
    if (!feature?.geometry || feature.geometry.type !== 'Polygon') return 0;

    const ring = feature.geometry.coordinates?.[0];
    if (!Array.isArray(ring) || ring.length < 4) return 0;

    const earthRadius = 6378137;
    const lat0 =
      ring.reduce((sum: number, coord: number[]) => sum + coord[1], 0) /
      ring.length;
    const lat0Rad = (lat0 * Math.PI) / 180;

    const points = ring.map((coord: number[]) => {
      const lng = coord[0];
      const lat = coord[1];

      const x = earthRadius * ((lng * Math.PI) / 180) * Math.cos(lat0Rad);
      const y = earthRadius * ((lat * Math.PI) / 180);

      return { x, y };
    });

    let area = 0;

    for (let i = 0; i < points.length - 1; i++) {
      area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
    }

    return Math.abs(area / 2);
  }
}