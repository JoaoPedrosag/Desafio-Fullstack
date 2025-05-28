import { MessageJobDTO } from '../dto/message-job.dto';

export interface JobInfo {
  id: string | undefined;
  data: MessageJobDTO;
  failedReason?: string;
  stacktrace?: string | null;
  attemptsMade: number;
  timestamp: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface QueueInfo {
  name: string;
  stats: Record<string, number>;
  jobs: QueueStats;
  failedJobsDetails: JobInfo[];
  connectionStatus: string;
  lastCheck: string;
}

export interface ClearJobsResult {
  message: string;
  timestamp: string;
}
