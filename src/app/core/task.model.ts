export type TaskStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface IrrigationTask {
  id?: number;
  name: string;
  location: string;
  duration: number;
  waterAmount: number;
  debit: number;
  startTime: string; // "2026-03-05T07:30:00"
  crop: string;
  status?: TaskStatus;
}