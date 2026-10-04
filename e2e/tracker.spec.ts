import { test, expect } from '@playwright/test';

test.describe.serial('Backlink Tracker - Complete E2E Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Enable mock mode for fast, deterministic, and isolated testing
    await page.addInitScript(() => {
      window.__USE_MOCK_STORAGE__ = true;
    });
  });

  test('1. Application loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check main header
    await expect(page.locator('h1')).toContainText('Backlink Tracker');

    // Check navigation tabs
    await expect(page.getByTestId('nav-todo')).toBeVisible();
    await expect(page.getByTestId('nav-submissions')).toBeVisible();
    await expect(page.getByTestId('nav-apps')).toBeVisible();
    await expect(page.getByTestId('nav-websites')).toBeVisible();

    // Check default landing screen is "What To Do Now"
    await expect(page.getByRole('heading', { name: 'What To Do Now' })).toBeVisible();
  });

  test('2. Create an Android App', async ({ page }) => {
    await page.goto('/');

    // Go to Android Apps tab
    await page.getByTestId('nav-apps').click();

    // Open Add App form
    await page.getByTestId('btn-add-app').click();
    await expect(page.getByTestId('app-form-card')).toBeVisible();

    // Fill form
    await page.getByTestId('input-app-name').fill('Habit Tracker Pro');
    await page.getByTestId('input-app-url').fill('https://play.google.com/store/apps/details?id=com.habit.pro');
    await page.getByTestId('input-app-notes').fill('Self improvement category');

    // Submit form
    await page.getByTestId('btn-submit-app').click();

    // Verify success and list presence
    await expect(page.getByTestId('app-success-alert')).toBeVisible();
    await expect(page.locator('table')).toContainText('Habit Tracker Pro');
  });

  test('3. Create a Website', async ({ page }) => {
    await page.goto('/');

    // Go to Websites tab
    await page.getByTestId('nav-websites').click();

    // Open Add Website form
    await page.getByTestId('btn-add-website').click();
    await expect(page.getByTestId('website-form-card')).toBeVisible();

    // Fill form
    await page.getByTestId('input-website-name').fill('Product Hunt');
    await page.getByTestId('input-website-url').fill('https://www.producthunt.com');
    await page.getByTestId('input-website-notes').fill('Launch directory with high domain authority');

    // Submit form
    await page.getByTestId('btn-submit-website').click();

    // Verify success and list presence
    await expect(page.getByTestId('website-success-alert')).toBeVisible();
    await expect(page.locator('table')).toContainText('Product Hunt');
  });

  test('4 & 5. Create a Submission linking the App and Website and verify default status is APPROVED', async ({ page }) => {
    await page.goto('/');

    // Setup app and website first
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Habit Tracker Pro');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Product Hunt');
    await page.getByTestId('btn-submit-website').click();

    // Navigate to Submissions tab
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await expect(page.getByTestId('submission-form-card')).toBeVisible();

    // Verify default status is APPROVED
    const statusSelect = page.getByTestId('input-submission-status');
    await expect(statusSelect).toHaveValue('APPROVED');

    // Fill post URL and notes
    await page.getByTestId('input-submission-post-url').fill('https://producthunt.com/posts/habit-tracker-pro');
    await page.getByTestId('input-submission-notes').fill('Targeting launch next Monday');
    await page.getByTestId('btn-submit-submission').click();

    await expect(page.getByTestId('submission-success-alert')).toBeVisible();

    // Check table has row linking Habit Tracker Pro and Product Hunt with status APPROVED and post URL
    const table = page.getByTestId('submissions-table');
    await expect(table).toContainText('Habit Tracker Pro');
    await expect(table).toContainText('Product Hunt');
    await expect(page.getByTestId('status-badge-approved')).toBeVisible();
    await expect(table).toContainText('https://producthunt.com/posts/habit-tracker-pro');
  });

  test('6 & 7. Change Submission status and verify Dashboard immediately reflects the change', async ({ page }) => {
    await page.goto('/');

    // Create App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Habit Tracker Pro');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Product Hunt');
    await page.getByTestId('btn-submit-website').click();

    // Create Submission with status TODO
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('input-submission-status').selectOption('TODO');
    await page.getByTestId('btn-submit-submission').click();

    // Go to "What To Do Now"
    await page.getByTestId('nav-todo').click();
    await expect(page.getByTestId('metric-todo-count')).toHaveText('1');
    await expect(page.getByTestId('metric-waiting-count')).toHaveText('0');

    // Change status from TODO to WAITING via quick status button
    const quickWaitingBtn = page.locator('button[data-testid^="quick-status-waiting-"]');
    await quickWaitingBtn.click();

    // Check dashboard metrics updated immediately
    await expect(page.getByTestId('metric-todo-count')).toHaveText('0');
    await expect(page.getByTestId('metric-waiting-count')).toHaveText('1');
    await expect(page.getByTestId('status-badge-waiting')).toBeVisible();

    // Change status from WAITING to APPROVED
    const quickApprovedBtn = page.locator('button[data-testid^="quick-status-approved-"]');
    await quickApprovedBtn.click();

    // Check dashboard metric APPROVED updated
    await expect(page.getByTestId('metric-waiting-count')).toHaveText('0');
    await expect(page.getByTestId('metric-approved-count')).toHaveText('1');
  });

  test('8. Edit an App and verify related Submission displays the updated App name', async ({ page }) => {
    await page.goto('/');

    // Create initial App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Habit Tracker Initial');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Product Hunt');
    await page.getByTestId('btn-submit-website').click();

    // Create submission with TODO status so it appears in What To Do Now queue
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('input-submission-status').selectOption('TODO');
    await page.getByTestId('btn-submit-submission').click();

    // Edit the App name
    await page.getByTestId('nav-apps').click();
    const editAppBtn = page.locator('button[data-testid^="btn-edit-app-"]');
    await editAppBtn.click();

    await page.getByTestId('input-app-name').fill('Habit Tracker Renamed');
    await page.getByTestId('btn-submit-app').click();
    await expect(page.getByTestId('app-success-alert')).toBeVisible();

    // Verify in Submissions view that the related submission displays the updated name
    await page.getByTestId('nav-submissions').click();
    const submissionTable = page.getByTestId('submissions-table');
    await expect(submissionTable).toContainText('Habit Tracker Renamed');
    await expect(submissionTable).not.toContainText('Habit Tracker Initial');

    // Verify also in "What To Do Now" queue
    await page.getByTestId('nav-todo').click();
    await expect(page.locator('main')).toContainText('Habit Tracker Renamed');
  });

  test('9. Edit a Website and verify related Submission displays the updated Website name', async ({ page }) => {
    await page.goto('/');

    // Create initial App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Habit Tracker Pro');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('BetaList Initial');
    await page.getByTestId('btn-submit-website').click();

    // Create submission with TODO status
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('input-submission-status').selectOption('TODO');
    await page.getByTestId('btn-submit-submission').click();

    // Edit the Website name
    await page.getByTestId('nav-websites').click();
    const editWebsiteBtn = page.locator('button[data-testid^="btn-edit-website-"]');
    await editWebsiteBtn.click();

    await page.getByTestId('input-website-name').fill('BetaList Updated');
    await page.getByTestId('btn-submit-website').click();
    await expect(page.getByTestId('website-success-alert')).toBeVisible();

    // Verify in Submissions view
    await page.getByTestId('nav-submissions').click();
    const submissionTable = page.getByTestId('submissions-table');
    await expect(submissionTable).toContainText('BetaList Updated');
    await expect(submissionTable).not.toContainText('BetaList Initial');

    // Verify also in "What To Do Now" queue
    await page.getByTestId('nav-todo').click();
    await expect(page.locator('main')).toContainText('BetaList Updated');
  });

  test('10. Attempt to delete an App with related submissions and verify deletion is blocked', async ({ page }) => {
    await page.goto('/');

    // Create App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Critical App');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Directory X');
    await page.getByTestId('btn-submit-website').click();

    // Create submission linking them
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('btn-submit-submission').click();

    // Navigate to Apps tab and attempt deletion
    await page.getByTestId('nav-apps').click();
    const deleteAppBtn = page.locator('button[data-testid^="btn-delete-app-"]');
    await deleteAppBtn.click();

    // Verify deletion error alert appears
    const errorAlert = page.getByTestId('app-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Cannot delete');
    await expect(errorAlert).toContainText('submission');

    // Verify App still exists in the table
    await expect(page.getByTestId('apps-table')).toContainText('Critical App');
  });

  test('11. Attempt to delete a Website with related submissions and verify deletion is blocked', async ({ page }) => {
    await page.goto('/');

    // Create App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Critical App');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Critical Website');
    await page.getByTestId('btn-submit-website').click();

    // Create submission linking them
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('btn-submit-submission').click();

    // Navigate to Websites tab and attempt deletion
    await page.getByTestId('nav-websites').click();
    const deleteWebsiteBtn = page.locator('button[data-testid^="btn-delete-website-"]');
    await deleteWebsiteBtn.click();

    // Verify deletion error alert appears
    const errorAlert = page.getByTestId('website-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Cannot delete');
    await expect(errorAlert).toContainText('submission');

    // Verify Website still exists in the table
    await expect(page.getByTestId('websites-table')).toContainText('Critical Website');
  });

  test('12. Delete a Submission and verify it disappears', async ({ page }) => {
    await page.goto('/');

    // Create App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Delete Test App');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Delete Test Website');
    await page.getByTestId('btn-submit-website').click();

    // Create Submission
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('btn-submit-submission').click();
    await expect(page.getByTestId('submissions-table')).toContainText('Delete Test App');

    // Click delete button and then confirm delete
    const deleteBtn = page.locator('button[data-testid^="btn-delete-submission-"]');
    await deleteBtn.click();

    const confirmBtn = page.locator('button[data-testid^="btn-confirm-delete-submission-"]');
    await confirmBtn.click();

    // Verify submission disappears
    await expect(page.getByTestId('submission-success-alert')).toBeVisible();
    await expect(page.getByTestId('submissions-empty-state')).toBeVisible();

    // Verify "What To Do Now" queue is also empty
    await page.getByTestId('nav-todo').click();
    await expect(page.getByTestId('queue-empty-state')).toBeVisible();

    // Verify that now the app can be safely deleted since it has 0 submissions
    await page.getByTestId('nav-apps').click();
    const deleteAppBtn = page.locator('button[data-testid^="btn-delete-app-"]');
    await deleteAppBtn.click();
    const confirmAppDelete = page.locator('button[data-testid^="btn-confirm-delete-app-"]');
    await confirmAppDelete.click();
    await expect(page.getByTestId('apps-empty-state')).toBeVisible();
  });

  test('13. Prevent duplicate App + Website submissions', async ({ page }) => {
    await page.goto('/');

    // Create App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('App Duplication Test');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Site Duplication Test');
    await page.getByTestId('btn-submit-website').click();

    // Create first submission
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('btn-submit-submission').click();
    await expect(page.getByTestId('submission-success-alert')).toBeVisible();

    // Try to create DUPLICATE submission with same App and Website
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('btn-submit-submission').click();

    // Verify duplicate error alert is shown
    const errorAlert = page.getByTestId('submission-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('already exists');

    // Verify table still contains only 1 submission
    const rows = page.locator('tr[data-testid^="submission-row-"]');
    await expect(rows).toHaveCount(1);
  });

  test('14. Dark mode toggle switch works and persists in localStorage', async ({ page }) => {
    await page.goto('/');

    const toggleBtn = page.getByTestId('btn-toggle-dark-mode');
    await expect(toggleBtn).toBeVisible();

    // Initially light mode (unless system dark, but localStorage will be set)
    // Click toggle to enable dark mode
    await toggleBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const themeDark = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeDark).toBe('dark');

    // Click toggle again to return to light mode
    await toggleBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    const themeLight = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeLight).toBe('light');

    // Toggle to dark and reload to verify persistence across reloads
    await toggleBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('15. Next submission recommendation journey: autofill, target URL display, and auto-return to To Do', async ({ page }) => {
    await page.goto('/');

    // 1. Create an App
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('FitPulse Tracker');
    await page.getByTestId('btn-submit-app').click();

    // 2. Create Website A (DR 50) and Website B (DR 85)
    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Low DR Site');
    await page.getByTestId('input-website-dr').fill('50');
    await page.getByTestId('input-website-url').fill('https://lowdr.com');
    await page.getByTestId('btn-submit-website').click();

    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('High DR Authority Site');
    await page.getByTestId('input-website-dr').fill('85');
    await page.getByTestId('input-website-url').fill('https://highdr.com');
    await page.getByTestId('btn-submit-website').click();

    // 3. Return to To Do tab
    await page.getByTestId('nav-todo').click();

    // 4. Verify Next Recommended Submission card recommends High DR Authority Site (DR 85)
    const recCard = page.getByTestId('next-recommended-card');
    await expect(recCard).toBeVisible();
    await expect(recCard).toContainText('FitPulse Tracker');
    await expect(recCard).toContainText('High DR Authority Site');
    await expect(recCard).toContainText('DR 85');

    // 5. Click "Buat Submission Ini"
    await page.getByTestId('btn-create-recommended-submission').click();

    // 6. Verify we are now on Submissions tab, form is open and autofilled
    await expect(page.getByTestId('submission-form-card')).toBeVisible();
    await expect(page.getByTestId('input-submission-app')).toContainText('FitPulse Tracker');
    await expect(page.getByTestId('input-submission-website')).toContainText('High DR Authority Site');

    // 7. Verify Target Website URL is displayed below the dropdown
    const websiteUrlLink = page.getByTestId('selected-website-url-link');
    await expect(websiteUrlLink).toBeVisible();
    await expect(websiteUrlLink).toHaveAttribute('href', 'https://highdr.com');

    // 8. Submit the form
    await page.getByTestId('btn-submit-submission').click();

    // 9. Verify automatic return to To Do tab
    await expect(page.getByRole('heading', { name: 'What To Do Now' })).toBeVisible();

    // 10. Verify next recommendation now automatically updates to Low DR Site (DR 50)
    await expect(recCard).toBeVisible();
    await expect(recCard).toContainText('Low DR Site');
    await expect(recCard).toContainText('DR 50');
  });

  test('16. SKIPPED status: select in form, view badge, check metric count and filter', async ({ page }) => {
    await page.goto('/');

    // 1. Create an App and Website
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Skip Test App');
    await page.getByTestId('btn-submit-app').click();

    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Skip Test Site');
    await page.getByTestId('btn-submit-website').click();

    // 2. Go to Submissions, create submission with status SKIPPED
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await page.getByTestId('input-submission-status').selectOption('SKIPPED');
    await page.getByTestId('btn-submit-submission').click();

    // 3. Verify row has status badge SKIPPED
    await expect(page.getByTestId('status-badge-skipped')).toBeVisible();
    await expect(page.getByTestId('status-badge-skipped')).toContainText('SKIPPED');

    // 4. Verify filter by SKIPPED works
    await page.getByTestId('filter-status').selectOption('SKIPPED');
    const rows = page.locator('tr[data-testid^="submission-row-"]');
    await expect(rows).toHaveCount(1);

    // 5. Check "What To Do Now" metrics: Skipped count = 1
    await page.getByTestId('nav-todo').click();
    const skippedMetric = page.getByTestId('metric-skipped-count');
    await expect(skippedMetric).toBeVisible();
    await expect(skippedMetric).toHaveText('1');
  });

  test('17. Website notes displayed in submission form under website URL and not in table', async ({ page }) => {
    await page.goto('/');

    // 1. Create an App
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Notes Test App');
    await page.getByTestId('btn-submit-app').click();

    // 2. Create a Website with notes
    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('Notes Target Site');
    await page.getByTestId('input-website-url').fill('https://notestarget.example.com');
    await page.getByTestId('input-website-notes').fill('Requires reciprocal link and manual admin review');
    await page.getByTestId('btn-submit-website').click();

    // 3. Open Submissions form
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();

    // Check that website note appears in form under website url
    const notesInForm = page.getByTestId('selected-website-notes');
    await expect(notesInForm).toBeVisible();
    await expect(notesInForm).toContainText('Requires reciprocal link and manual admin review');

    // Submit the form
    await page.getByTestId('btn-submit-submission').click();

    // 4. In the submissions table, verify website name is shown but notes are not in the table
    const table = page.getByTestId('submissions-table');
    await expect(table).toContainText('Notes Target Site');
    await expect(table).not.toContainText('Requires reciprocal link and manual admin review');
  });

  test('18. Android App landing page URL creation, display, and copy buttons in submission form', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    // 1. Create an Android App with both Play Store URL and Landing Page URL
    await page.getByTestId('nav-apps').click();
    await page.getByTestId('btn-add-app').click();
    await page.getByTestId('input-app-name').fill('Super Productivity App');
    await page.getByTestId('input-app-url').fill('https://play.google.com/store/apps/details?id=com.super.app');
    await page.getByTestId('input-app-landing-url').fill('https://superproductivity.com');
    await page.getByTestId('btn-submit-app').click();

    // Verify success and that landing page is shown in Apps table
    await expect(page.getByTestId('app-success-alert')).toBeVisible();
    const appsTable = page.getByTestId('apps-table');
    await expect(appsTable).toContainText('Super Productivity App');
    await expect(appsTable).toContainText('Visit Landing Page');

    // 2. Create a target Website
    await page.getByTestId('nav-websites').click();
    await page.getByTestId('btn-add-website').click();
    await page.getByTestId('input-website-name').fill('App Directory');
    await page.getByTestId('input-website-url').fill('https://appdirectory.io');
    await page.getByTestId('btn-submit-website').click();

    // 3. Open Submission Form
    await page.getByTestId('nav-submissions').click();
    await page.getByTestId('btn-add-submission').click();
    await expect(page.getByTestId('submission-form-card')).toBeVisible();

    // Verify selected-app-info container is displayed below the app dropdown
    const appInfo = page.getByTestId('selected-app-info');
    await expect(appInfo).toBeVisible();

    // Verify Play Store URL link and Landing Page URL link are displayed
    const playStoreLink = page.getByTestId('selected-app-playstore-link');
    await expect(playStoreLink).toBeVisible();
    await expect(playStoreLink).toContainText('https://play.google.com/store/apps/details?id=com.super.app');

    const landingLink = page.getByTestId('selected-app-landing-link');
    await expect(landingLink).toBeVisible();
    await expect(landingLink).toContainText('https://superproductivity.com');

    // Verify Copy Play Store button
    const copyPlayStoreBtn = page.getByTestId('btn-copy-playstore-url');
    await expect(copyPlayStoreBtn).toBeVisible();
    await copyPlayStoreBtn.click();
    await expect(copyPlayStoreBtn).toContainText('Copied');

    // Verify Copy Landing Page button
    const copyLandingBtn = page.getByTestId('btn-copy-landing-url');
    await expect(copyLandingBtn).toBeVisible();
    await copyLandingBtn.click();
    await expect(copyLandingBtn).toContainText('Copied');
  });
});



