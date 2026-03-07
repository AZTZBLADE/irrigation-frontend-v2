import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task, TaskService, TaskStatus } from '../../../../core/task.service';

type UiTab = 'planned' | 'ongoing' | 'completed';

@Component({
  selector: 'app-user-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-tasks.component.html',
  styleUrl: './user-tasks.component.scss',
})
export class UserTasksComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';
  showModal = false;
  activeTab: UiTab = 'planned';

  tasks: Task[] = [];
  editingTaskId: number | null = null;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private updatingTaskIds = new Set<number>();

  locations = ['Parcelle B12', 'Ain El Karma', 'El Manara'];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    location: [this.locations[0], [Validators.required]],
    startTime: ['', [Validators.required]],
    duration: [60, [Validators.required, Validators.min(1)]],
    crop: ['', [Validators.required]],
    waterAmount: [1200.5, [Validators.required, Validators.min(0)]],
    debit: [20, [Validators.required, Validators.min(0)]],
    status: ['planned' as UiTab, [Validators.required]],
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
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    document.body.style.overflow = '';
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
      error: (err) => {
        console.error('GET TASKS ERROR', err);
        this.error = 'Failed to load tasks.';
        this.loading = false;
      },
    });
  }

  syncTasksWithTime(): void {
    const now = Date.now();

    this.tasks.forEach((task) => {
      if (!task.id || !task.startTime || !task.duration) return;

      const start = new Date(task.startTime).getTime();
      if (isNaN(start)) return;

      const end = start + Number(task.duration) * 60000;
      const currentStatus = (task.status || 'planned') as UiTab;

      if (now < start) {
        return;
      }

      if (now >= start && now < end) {
        if (currentStatus !== 'ongoing') {
          this.markAsOngoing(task, false);
        }
        return;
      }

      if (now >= end) {
        if (currentStatus !== 'completed') {
          this.markAsComplete(task, false);
        }
      }
    });
  }

  setTab(tab: UiTab): void {
    this.activeTab = tab;
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter(
      (task) => ((task.status || 'planned') as UiTab) === this.activeTab
    );
  }

  get plannedCount(): number {
    return this.tasks.filter(
      (task) => ((task.status || 'planned') as UiTab) === 'planned'
    ).length;
  }

  get ongoingCount(): number {
    return this.tasks.filter(
      (task) => ((task.status || 'planned') as UiTab) === 'ongoing'
    ).length;
  }

  get completedCount(): number {
    return this.tasks.filter(
      (task) => ((task.status || 'planned') as UiTab) === 'completed'
    ).length;
  }

  openModal(): void {
    this.error = '';
    this.editingTaskId = null;

    this.form.reset({
      name: '',
      location: this.locations[0],
      startTime: '',
      duration: 60,
      crop: '',
      waterAmount: 1200.5,
      debit: 20,
      status: 'planned',
    });

    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTaskId = null;
    document.body.style.overflow = '';
  }

  editTask(task: Task): void {
    this.error = '';
    this.editingTaskId = task.id ?? null;

    this.form.patchValue({
      name: task.name,
      location: task.location,
      startTime: this.toDateTimeLocal(task.startTime),
      duration: task.duration,
      crop: task.crop,
      waterAmount: task.waterAmount,
      debit: task.debit,
      status: (task.status || 'planned') as UiTab,
    });

    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  submit(): void {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fill all required fields.';
      return;
    }

    const value = this.form.getRawValue();

    const startTime =
      value.startTime && value.startTime.length === 16
        ? `${value.startTime}:00`
        : (value.startTime || '');

    const payload: Task = {
      name: value.name || '',
      location: value.location || '',
      duration: Number(value.duration),
      waterAmount: Number(value.waterAmount),
      debit: Number(value.debit),
      startTime,
      crop: value.crop || '',
      status: (value.status || 'planned') as TaskStatus,
    };

    this.loading = true;

    if (this.editingTaskId !== null) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadTasks();
        },
        error: (err) => {
          console.error('UPDATE ERROR', err);
          this.loading = false;
          this.error = err?.error?.message || `Error ${err.status}: ${err.statusText}`;
        },
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadTasks();
        },
        error: (err) => {
          console.error('CREATE ERROR', err);
          this.loading = false;
          this.error = err?.error?.message || `Error ${err.status}: ${err.statusText}`;
        },
      });
    }
  }

  deleteTask(task: Task): void {
    if (task.id == null) return;

    const ok = confirm(`Delete task "${task.name}" ?`);
    if (!ok) return;

    this.loading = true;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.loading = false;
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
      },
      error: (err) => {
        console.error('DELETE ERROR', err);
        this.loading = false;
        this.error = err?.error?.message || `Delete failed (${err.status})`;
      },
    });
  }

  markAsOngoing(task: Task, reload = true): void {
    if (task.id == null) return;
    if (this.updatingTaskIds.has(task.id)) return;

    this.updatingTaskIds.add(task.id);

    const updatedTask: Task = {
      ...task,
      status: 'ongoing',
    };

    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
        task.status = 'ongoing';
        this.updatingTaskIds.delete(task.id!);

        if (reload) {
          this.loadTasks();
        }
      },
      error: (err) => {
        console.error('MARK ONGOING ERROR', err);
        this.updatingTaskIds.delete(task.id!);

        if (reload) {
          this.error = err?.error?.message || `Update failed (${err.status})`;
        }
      },
    });
  }

  markAsComplete(task: Task, reload = true): void {
    if (task.id == null) return;
    if (this.updatingTaskIds.has(task.id)) return;

    this.updatingTaskIds.add(task.id);

    const updatedTask: Task = {
      ...task,
      status: 'completed',
    };

    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
        task.status = 'completed';
        this.updatingTaskIds.delete(task.id!);

        if (reload) {
          this.loadTasks();
        }
      },
      error: (err) => {
        console.error('MARK COMPLETE ERROR', err);
        this.updatingTaskIds.delete(task.id!);

        if (reload) {
          this.error = err?.error?.message || `Update failed (${err.status})`;
        }
      },
    });
  }

  statusLabel(status?: string): string {
    const s = (status || 'planned') as UiTab;

    if (s === 'ongoing') return 'In Progress';
    if (s === 'completed') return 'Completed';
    return 'Planned';
  }

  toDateTimeLocal(dateTime?: string): string {
    if (!dateTime) return '';
    return dateTime.length >= 16 ? dateTime.slice(0, 16) : dateTime;
  }

  getProgress(task: Task): number {
    if (!task.startTime || !task.duration) return 0;

    const start = new Date(task.startTime).getTime();
    if (isNaN(start)) return 0;

    const end = start + Number(task.duration) * 60000;
    const now = Date.now();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  }

  getRemainingTime(task: Task): string {
    if (!task.startTime || !task.duration) return '-';

    const start = new Date(task.startTime).getTime();
    if (isNaN(start)) return '-';

    const end = start + Number(task.duration) * 60000;
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Finished';

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}m ${seconds}s`;
  }
}