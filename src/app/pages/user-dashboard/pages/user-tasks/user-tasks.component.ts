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
import { TaskService, Task, TaskStatus } from '../../../../core/task.service';

type UiTab = 'planned' | 'ongoing' | 'terminated';
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
  marker: any = null;

  loading = false;
  error = '';

  tasks: Task[] = [];

  activeTab: UiTab = 'planned';
  viewMode: ViewMode = 'cards';
  dateSort: DateSort = 'newest';

  searchTerm = '';

  showModal = false;
  editingTaskId: number | null = null;

  showMapModal = false;
  selectedLatLng = '';

  private intervalId: any;
  private updatingTaskIds = new Set<number>();

  form = this.fb.group({
    name: ['', Validators.required],
    location: ['', Validators.required],
    startTime: ['', Validators.required],
    duration: [60, [Validators.required, Validators.min(1)]],
    crop: ['', Validators.required],
    waterAmount: [1200, [Validators.required, Validators.min(0)]],
    debit: [20, [Validators.required, Validators.min(0)]],
    status: ['planned' as UiTab, Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadTasks();

    this.intervalId = setInterval(() => {
      this.syncTasksWithTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadTasks(): void {
    this.loading = true;
    this.error = '';

    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = (data || []).map((task) => ({
          ...task,
          status: (task.status || 'planned') as TaskStatus,
        }));
        this.loading = false;
        this.syncTasksWithTime();
      },
      error: () => {
        this.error = 'Failed to load tasks';
        this.loading = false;
      },
    });
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

  get filteredTasks(): Task[] {
    const filtered = this.tasks.filter((task) => {
      const statusOk = (task.status || 'planned') === this.activeTab;

      const search = this.searchTerm.trim().toLowerCase();

      const searchOk =
        !search ||
        task.name.toLowerCase().includes(search) ||
        task.location.toLowerCase().includes(search) ||
        task.crop.toLowerCase().includes(search);

      return statusOk && searchOk;
    });

    return filtered.sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;

      return this.dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }

  get plannedCount(): number {
    return this.tasks.filter((t) => (t.status || 'planned') === 'planned').length;
  }

  get ongoingCount(): number {
    return this.tasks.filter((t) => (t.status || 'planned') === 'ongoing').length;
  }

  get terminatedCount(): number {
    return this.tasks.filter((t) => (t.status || 'planned') === 'terminated').length;
  }

  openModal(): void {
    this.editingTaskId = null;
    this.error = '';

    this.form.reset({
      name: '',
      location: '',
      startTime: '',
      duration: 60,
      crop: '',
      waterAmount: 1200,
      debit: 20,
      status: 'planned',
    });

    this.selectedLatLng = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTaskId = null;
  }

  editTask(task: Task): void {
    this.editingTaskId = task.id ?? null;
    this.error = '';

    this.form.patchValue({
      name: task.name,
      location: task.location,
      startTime: task.startTime?.slice(0, 16),
      duration: task.duration,
      crop: task.crop,
      waterAmount: task.waterAmount,
      debit: task.debit,
      status: (task.status || 'planned') as UiTab,
    });

    this.selectedLatLng = task.location || '';
    this.showModal = true;
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const raw = this.form.getRawValue();

    const payload: Task = {
      name: raw.name || '',
      location: raw.location || '',
      startTime: raw.startTime || '',
      duration: Number(raw.duration || 0),
      crop: raw.crop || '',
      waterAmount: Number(raw.waterAmount || 0),
      debit: Number(raw.debit || 0),
      status: (raw.status || 'planned') as TaskStatus,
    };

    if (this.editingTaskId !== null) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadTasks();
        },
        error: () => {
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
        },
        error: () => {
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
      },
      error: () => {
        this.error = 'Delete failed';
      },
    });
  }

  markAsOngoing(task: Task): void {
    if (!task.id) return;
    if (this.updatingTaskIds.has(task.id)) return;

    this.updatingTaskIds.add(task.id);

    const updated: Task = {
      ...task,
      status: 'ongoing',
    };

    this.taskService.updateTask(task.id, updated).subscribe({
      next: () => {
        task.status = 'ongoing';
        this.updatingTaskIds.delete(task.id!);
      },
      error: () => {
        this.updatingTaskIds.delete(task.id!);
      },
    });
  }

  markAsTerminated(task: Task): void {
    if (!task.id) return;
    if (this.updatingTaskIds.has(task.id)) return;

    this.updatingTaskIds.add(task.id);

    const updated: Task = {
      ...task,
      status: 'terminated',
    };

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

    if (this.isBrowser) {
      setTimeout(async () => {
        await this.initMap();

        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
          this.loadMapFromExistingLocation();
        }, 200);
      }, 100);
    }
  }

  closeMapModal(): void {
    this.showMapModal = false;

    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  confirmMapLocation(): void {
    if (this.selectedLatLng) {
      this.form.patchValue({
        location: this.selectedLatLng,
      });
    }

    this.closeMapModal();
  }

  async initMap(): Promise<void> {
    if (!this.isBrowser) return;

    if (!this.L) {
      const leaflet = await import('leaflet');
      this.L = leaflet;
    }

    if (this.map) {
      this.map.remove();
    }

    this.map = this.L.map('task-map-modal').setView([36.8065, 10.1815], 13);

    this.L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
      }
    ).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);

    this.map.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = this.L.marker([lat, lng]).addTo(this.map);

      this.selectedLatLng = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      console.log('MAP CLICK', this.selectedLatLng);
    });
  }

  loadMapFromExistingLocation(): void {
    const value = this.form.get('location')?.value;

    if (!value || typeof value !== 'string' || !value.includes(',')) return;
    if (!this.map || !this.L) return;

    const [latStr, lngStr] = value.split(',');
    const lat = Number(latStr);
    const lng = Number(lngStr);

    if (isNaN(lat) || isNaN(lng)) return;

    this.selectedLatLng = value;
    this.map.setView([lat, lng], 13);

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = this.L.marker([lat, lng]).addTo(this.map);
  }

  syncTasksWithTime(): void {
    const now = Date.now();

    this.tasks.forEach((task) => {
      if (!task.startTime || !task.duration) return;

      const start = new Date(task.startTime).getTime();
      const end = start + task.duration * 60000;

      if (now >= end && task.status !== 'terminated') {
        this.markAsTerminated(task);
        return;
      }

      if (now >= start && now < end) {
        task.status = 'ongoing';
        return;
      }

      if (now < start) {
        task.status = 'planned';
      }
    });
  }

  statusLabel(status?: string): string {
    if (status === 'terminated') return 'Completed';
    if (status === 'ongoing') return 'In Progress';
    return 'Planned';
  }

  getProgress(task: Task): number {
    if (!task.startTime || !task.duration) return 0;

    const start = new Date(task.startTime).getTime();
    const end = start + task.duration * 60000;
    const now = Date.now();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  }

  getRemainingTime(task: Task): string {
    if (!task.startTime || !task.duration) return '-';

    const start = new Date(task.startTime).getTime();
    const end = start + task.duration * 60000;
    const now = Date.now();

    const diff = end - now;
    if (diff <= 0) return 'Finished';

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}m ${seconds}s`;
  }
}