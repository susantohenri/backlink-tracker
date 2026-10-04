export type SubmissionStatus = 'TODO' | 'WAITING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export interface AndroidApp {
  id: string;
  name: string;
  playStoreUrl: string;
  landingPageUrl?: string;
  videoUrl?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  name: string;
  url: string;
  notes: string;
  dr?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  appId: string;
  websiteId: string;
  status: SubmissionStatus;
  submissionDate: string;
  postUrl?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type TabType = 'todo' | 'submissions' | 'apps' | 'websites';

export interface AppFormData {
  name: string;
  playStoreUrl: string;
  landingPageUrl?: string;
  videoUrl?: string;
  notes: string;
}

export interface WebsiteFormData {
  name: string;
  url: string;
  notes: string;
  dr?: number;
}

export interface SubmissionFormData {
  appId: string;
  websiteId: string;
  status: SubmissionStatus;
  submissionDate?: string;
  postUrl?: string;
  notes: string;
}
