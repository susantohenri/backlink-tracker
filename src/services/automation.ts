import type { AndroidApp, Website, Submission, AutomationResult } from '../types';

export interface RunSubmissionParams {
  app: AndroidApp;
  website: Website;
  submission?: Submission;
}

export function isWebsiteAutomationSupported(website?: Website | null): boolean {
  if (!website) return false;
  const url = (website.url || '').toLowerCase();
  const name = (website.name || '').toLowerCase();
  return url.includes('activesearchresults.com') || name.includes('active search results');
}

export async function runSubmissionAutomation({
  app,
  website,
  submission,
}: RunSubmissionParams): Promise<AutomationResult> {
  const serverUrl = import.meta.env.VITE_AUTOMATION_SERVER_URL || 'http://localhost:3001';
  const endpoint = `${serverUrl.replace(/\/+$/, '')}/run-submission`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ app, website, submission }),
    });

    const data: AutomationResult = await res.json().catch(() => ({
      status: 'FAILED' as const,
      message: `Failed to parse response from automation server (${res.status} ${res.statusText})`,
    }));

    return data;
  } catch (err) {
    console.error('Automation server connection error:', err);
    return {
      status: 'FAILED',
      message: `Unable to connect to local automation server at ${serverUrl}. Please ensure the automation server is running (npm run automation).`,
    };
  }
}
