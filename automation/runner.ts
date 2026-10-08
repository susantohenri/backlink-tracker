import type { AndroidApp, Website, Submission, AutomationResult } from '../src/types/index.ts';
import type { AutomationConfig } from './config.ts';
import { runActiveSearchResults } from './sites/active-search-results.ts';

export function isActiveSearchResults(website: Website): boolean {
  const url = (website.url || '').toLowerCase();
  const name = (website.name || '').toLowerCase();
  return url.includes('activesearchresults.com') || name.includes('active search results');
}

export function isWebsiteAutomationSupported(website?: Website): boolean {
  if (!website) return false;
  return isActiveSearchResults(website);
}

export async function runSubmissionAutomation(
  input: { app: AndroidApp; website: Website; submission?: Submission },
  config: AutomationConfig
): Promise<AutomationResult> {
  if (!input.app) {
    return {
      status: 'FAILED',
      message: 'Android App data is missing.',
    };
  }

  if (!input.website) {
    return {
      status: 'FAILED',
      message: 'Target Website data is missing.',
    };
  }

  if (isActiveSearchResults(input.website)) {
    return runActiveSearchResults({
      app: input.app,
      website: input.website,
      submission: input.submission,
      config,
    });
  }

  return {
    status: 'MANUAL_REQUIRED',
    message: `Automation is not implemented for "${input.website.name}" yet.`,
  };
}
