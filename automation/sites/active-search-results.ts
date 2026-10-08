import { chromium, type Page } from '@playwright/test';
import type { AndroidApp, Website, Submission, AutomationResult } from '../../src/types/index.ts';
import type { AutomationConfig } from '../config.ts';

export interface SiteAutomationInput {
  app: AndroidApp;
  website: Website;
  submission?: Submission;
  config: AutomationConfig;
}

interface MemberUrlRow {
  urlText: string;
  status: string;
  detailsUrl?: string;
  resubmitUrl?: string;
  rawHref?: string;
}

interface TargetUrlItem {
  type: 'landing' | 'playstore';
  label: string;
  url: string;
}

interface ProcessedUrlResult {
  type: 'landing' | 'playstore';
  label: string;
  url: string;
  status: string;
  detailsUrl?: string;
}

function normalizeUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}${u.search}`.toLowerCase();
  } catch {
    return rawUrl.trim().replace(/\/+$/, '').toLowerCase();
  }
}

async function extractMemberRows(page: Page): Promise<MemberUrlRow[]> {
  return page.locator('table table tr').evaluateAll((trs) => {
    const rows: MemberUrlRow[] = [];
    for (const tr of trs) {
      const tds = Array.from(tr.querySelectorAll('td, th')).map((td) => td.innerText.trim());
      // Expecting rows with at least 6-7 columns: Details, Re-Submit, Edit, Delete, Web Site Address, Status, Last Submit
      if (tds.length >= 6) {
        const links = Array.from(tr.querySelectorAll('a')).map((a) => ({
          text: a.innerText.trim(),
          href: a.href,
        }));

        const detailsUrl = links.find((l) => l.href.includes('listurldetails.php'))?.href;
        const resubmitUrl = links.find((l) => l.href.includes('addwebsite.php'))?.href;
        const targetLink = links.find(
          (l) => !l.href.includes('activesearchresults.com/members/') && !l.href.includes('addwebsite.php')
        );

        const status = tds[5] || 'Submitted';
        const urlText = tds[4] || '';

        if (detailsUrl || urlText) {
          rows.push({
            urlText,
            status,
            detailsUrl,
            resubmitUrl,
            rawHref: targetLink?.href,
          });
        }
      }
    }
    return rows;
  }).catch(() => []);
}

function findMatchingRow(rows: MemberUrlRow[], targetUrl: string): MemberUrlRow | undefined {
  const normTarget = normalizeUrl(targetUrl);

  return rows.find((row) => {
    if (row.rawHref && normalizeUrl(row.rawHref) === normTarget) {
      return true;
    }
    if (row.urlText) {
      const cleanSnippet = row.urlText.replace(/\.\.\./g, '').trim().toLowerCase();
      if (cleanSnippet && normTarget.includes(cleanSnippet)) {
        return true;
      }
    }
    return false;
  });
}

export async function runActiveSearchResults(input: SiteAutomationInput): Promise<AutomationResult> {
  const { app, config } = input;

  // 1. Collect all target URLs (both Landing Page AND Play Store listing if available)
  const targetUrls: TargetUrlItem[] = [];

  if (app.landingPageUrl?.trim()) {
    let lUrl = app.landingPageUrl.trim();
    if (!/^https?:\/\//i.test(lUrl)) lUrl = `https://${lUrl}`;
    targetUrls.push({ type: 'landing', label: 'Landing Page', url: lUrl });
  }

  if (app.playStoreUrl?.trim()) {
    let pUrl = app.playStoreUrl.trim();
    if (!/^https?:\/\//i.test(pUrl)) pUrl = `https://${pUrl}`;
    // Avoid duplicate if landingPageUrl happens to be identical to playStoreUrl
    if (!targetUrls.some((t) => normalizeUrl(t.url) === normalizeUrl(pUrl))) {
      targetUrls.push({ type: 'playstore', label: 'Play Store Listing', url: pUrl });
    }
  }

  if (targetUrls.length === 0) {
    return {
      status: 'FAILED',
      message: 'No target URL found in the selected Android App (neither Landing Page URL nor Play Store URL is configured).',
    };
  }

  // 2. Validate email from config
  const email = (config.defaultEmail || '').trim();
  const password = (config.defaultPassword || '').trim();

  if (!email) {
    return {
      status: 'MANUAL_REQUIRED',
      message: 'Active Search Results requires a contact email. Please configure DEFAULT_SUBMISSION_EMAIL in your .env file.',
    };
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: config.headless,
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    let isLoggedIn = false;

    // 3. Attempt Member Login if password is provided
    if (password) {
      console.log('[ASR] Logging in with member account:', email);
      await page.goto('https://www.activesearchresults.com/login/login.php', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const emailInput = page.locator('input[name="email"]');
      const passInput = page.locator('input[name="password"]');
      const signinBtn = page.locator('input[name="signin"]');

      if ((await emailInput.isVisible().catch(() => false)) && (await passInput.isVisible().catch(() => false))) {
        await emailInput.fill(email);
        await passInput.fill(password);

        await Promise.all([
          page.waitForNavigation({ timeout: 20000 }).catch(() => null),
          signinBtn.click(),
        ]);

        const currentUrl = page.url();
        const pageText = (await page.innerText('body').catch(() => '')).toLowerCase();

        if (currentUrl.includes('/members/') || pageText.includes('sign out') || pageText.includes("member's area")) {
          isLoggedIn = true;
          console.log('[ASR] Member login successful.');
        } else if (pageText.includes('invalid') || pageText.includes('incorrect') || pageText.includes('error')) {
          return {
            status: 'FAILED',
            message: 'Active Search Results member login failed. Please verify DEFAULT_SUBMISSION_EMAIL and DEFAULT_SUBMISSION_PASSWORD in .env.',
          };
        }
      }
    }

    const processedResults: ProcessedUrlResult[] = [];

    // 4. Process each target URL (Landing Page and/or Play Store Listing)
    for (const item of targetUrls) {
      console.log(`[ASR] Processing ${item.label}: ${item.url}...`);

      if (isLoggedIn) {
        // Check if already in listurls.php
        await page.goto('https://www.activesearchresults.com/members/listurls.php', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        const existingRows = await extractMemberRows(page);
        const matchedRow = findMatchingRow(existingRows, item.url);

        if (matchedRow) {
          console.log(`[ASR] ${item.label} already in member list (Status: ${matchedRow.status}). Refreshing...`);

          // Re-submit if resubmitUrl is available to refresh crawl schedule
          if (matchedRow.resubmitUrl) {
            await page.goto(matchedRow.resubmitUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            const submitBtn = page.locator('input[name="submiturl"], input[type="submit"][value="Submit"]');
            if (await submitBtn.isVisible().catch(() => false)) {
              await Promise.all([
                page.waitForNavigation({ timeout: 20000 }).catch(() => null),
                submitBtn.click(),
              ]);
            }
          }

          processedResults.push({
            type: item.type,
            label: item.label,
            url: item.url,
            status: matchedRow.status || 'Indexed',
            detailsUrl: matchedRow.detailsUrl || 'https://www.activesearchresults.com/members/listurls.php',
          });
          continue;
        }
      }

      // If not yet in listurls (or not logged in), submit via addwebsite.php
      console.log(`[ASR] Submitting ${item.label} via addwebsite.php...`);
      await page.goto('https://www.activesearchresults.com/addwebsite.php', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Check for CAPTCHA / anti-bot
      const captchaSelector = 'iframe[src*="captcha"], iframe[src*="turnstile"], iframe[src*="recaptcha"], .g-recaptcha, #cf-challenge';
      const hasCaptcha = await page.locator(captchaSelector).count().catch(() => 0);
      if (hasCaptcha > 0) {
        return {
          status: 'MANUAL_REQUIRED',
          message: `Anti-bot or CAPTCHA challenge detected while submitting ${item.label}.`,
        };
      }

      const urlInput = page.locator('input[name="url"]');
      const emailInput = page.locator('input[name="email"]');
      const submitBtn = page.locator('input[name="submiturl"], input[type="submit"][value="Submit"]');

      if (!(await urlInput.isVisible().catch(() => false))) {
        return {
          status: 'FAILED',
          message: `URL input field not found on Active Search Results submission page for ${item.label}.`,
        };
      }

      await urlInput.fill(item.url);

      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(email);
      }

      await Promise.all([
        page.waitForNavigation({ timeout: 25000 }).catch(() => null),
        submitBtn.click(),
      ]);

      await page.waitForLoadState('domcontentloaded').catch(() => {});
      const postSubmitText = (await page.innerText('body').catch(() => '')).toLowerCase();

      if (postSubmitText.includes('500 internal server error') || postSubmitText.includes('an error occurred')) {
        return {
          status: 'FAILED',
          message: `Active Search Results returned an internal server error while submitting ${item.label}.`,
        };
      }

      if (postSubmitText.includes('invalid url') || postSubmitText.includes('invalid email')) {
        return {
          status: 'FAILED',
          message: `Active Search Results rejected ${item.label} (invalid URL or email format).`,
        };
      }

      // If logged in, fetch newly tracked details from listurls.php
      if (isLoggedIn) {
        await page.goto('https://www.activesearchresults.com/members/listurls.php', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        const updatedRows = await extractMemberRows(page);
        const newlyMatched = findMatchingRow(updatedRows, item.url);

        processedResults.push({
          type: item.type,
          label: item.label,
          url: item.url,
          status: newlyMatched?.status || 'Waiting to Index',
          detailsUrl: newlyMatched?.detailsUrl || 'https://www.activesearchresults.com/members/listurls.php',
        });
      } else {
        processedResults.push({
          type: item.type,
          label: item.label,
          url: item.url,
          status: 'Submitted',
          detailsUrl: undefined,
        });
      }
    }

    // 5. Construct final result
    if (processedResults.length === 0) {
      return {
        status: 'FAILED',
        message: 'No URLs could be processed for Active Search Results.',
      };
    }

    const summaryParts = processedResults.map((r) => `${r.label} (${r.status})`);
    const summaryMsg =
      processedResults.length > 1
        ? `Active Search Results submission completed for ${summaryParts.join(' and ')}.`
        : `Active Search Results submission completed for ${summaryParts[0]}.`;

    // Prioritize Landing Page details URL as primary postUrl, fallback to Play Store listing details URL
    const landingResult = processedResults.find((r) => r.type === 'landing');
    const primaryPostUrl = landingResult?.detailsUrl || processedResults[0]?.detailsUrl;

    return {
      status: 'SUCCESS',
      message: summaryMsg,
      postUrl: primaryPostUrl,
    };
  } catch (error) {
    return {
      status: 'FAILED',
      message: error instanceof Error ? error.message : 'Unknown automation error occurred.',
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
