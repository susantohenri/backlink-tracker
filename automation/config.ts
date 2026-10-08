export interface AutomationConfig {
  port: number;
  headless: boolean;
  defaultEmail: string;
  defaultPassword: string;
}

export function getConfig(): AutomationConfig {
  const headless = !process.argv.includes('--headed');

  const port = parseInt(process.env.AUTOMATION_PORT || process.env.PORT || '3001', 10);
  const defaultEmail = process.env.DEFAULT_SUBMISSION_EMAIL || '';
  const defaultPassword = process.env.DEFAULT_SUBMISSION_PASSWORD || '';

  return {
    port,
    headless,
    defaultEmail,
    defaultPassword,
  };
}
