We are building a private personal Android app backlink tracker.

STACK
- React
- TypeScript
- Vite
- Firebase Firestore
- No authentication
- Playwright for E2E tests

GitHub repo:
https://github.com/susantohenri/backlink-tracker.git

GOAL

Build ONE tracker that can manage:
- hundreds of Android apps
- hundreds of websites
- thousands of app × website submissions

This is a personal productivity tool, not a SaaS product.

Do NOT create a separate tracker or project for each Android app.

Keep the architecture simple. No backend server unless absolutely necessary.

Use:
- TypeScript, not JavaScript
- strict typing
- no `any`
- clean, maintainable component structure
- simple architecture
- no unnecessary abstractions

DATA MODEL

ANDROID APPS
- id
- name
- playStoreUrl
- notes
- createdAt
- updatedAt

WEBSITES
- id
- name
- url
- notes
- createdAt
- updatedAt

SUBMISSIONS
- id
- appId
- websiteId
- status
- submissionDate
- notes
- createdAt
- updatedAt

SUBMISSION STATUS
- TODO
- WAITING
- APPROVED
- REJECTED

RELATIONSHIPS

- A Submission belongs to exactly one Android App through appId.
- A Submission belongs to exactly one Website through websiteId.
- Do NOT duplicate app name inside Submission.
- Do NOT duplicate website name inside Submission.
- Display the current App and Website names by resolving their IDs.

CRUD BEHAVIOR

ANDROID APP:
- Creating an App must NOT automatically create submissions.
- Editing an App must preserve all related submissions.
- Changing an App name must automatically be reflected wherever related submissions are displayed.
- Deleting an App that has related submissions must be blocked.
- Show a clear warning explaining that related submissions exist.
- Do not cascade-delete submissions.

WEBSITE:
- Creating a Website must NOT automatically create submissions.
- Editing a Website must preserve all related submissions.
- Changing a Website name must automatically be reflected wherever related submissions are displayed.
- Deleting a Website that has related submissions must be blocked.
- Show a clear warning explaining that related submissions exist.
- Do not cascade-delete submissions.

SUBMISSION:
- Creating a Submission requires selecting an existing Android App and Website.
- Default status is TODO.
- Editing a Submission only changes that submission.
- Deleting a Submission only deletes that submission.
- Changing Submission status must immediately affect the dashboard.
- Do not create duplicate submissions for the same App + Website combination.

DERIVED DATA

Do not store redundant counters or status summaries.

Calculate these from existing submissions:
- TODO count
- WAITING count
- APPROVED count
- REJECTED count
- submissions per App
- submissions per Website

USER JOURNEY

The primary workflow is:

1. Add Android Apps
2. Add Websites
3. Create App × Website Submissions
4. Use "What To Do Now" as the daily work queue
5. Perform the actual submission externally on the target website
6. Return to the tracker
7. Update the Submission status
8. Dashboard automatically reflects the new state

Example:

Apps:
- App A
- App B
- App C

Websites:
- Website 1
- Website 2
- Website 3

Submissions:
- App A × Website 1 → APPROVED
- App A × Website 2 → WAITING
- App B × Website 1 → TODO
- App B × Website 3 → REJECTED
- App C × Website 2 → TODO

The user should be able to open the tracker and immediately understand:
"What should I work on now?"

MAIN SCREENS

1. WHAT TO DO NOW
2. SUBMISSIONS
3. ANDROID APPS
4. WEBSITES

WHAT TO DO NOW

This is the primary landing screen.

Prioritize:
- TODO submissions first
- WAITING submissions second

Show useful information such as:
- App name
- Website name
- Website URL
- Submission status
- relevant notes

The user should be able to quickly open/edit a submission from this screen.

SUBMISSIONS

Provide:
- list/table view
- search
- filtering by status
- filtering by App
- filtering by Website
- sorting
- create submission
- edit submission
- delete submission

Prevent duplicate App + Website submissions.

ANDROID APPS

Provide:
- list/table view
- search
- create
- edit
- delete
- view related submission count

When deleting an App with related submissions:
- prevent deletion
- explain why

WEBSITES

Provide:
- list/table view
- search
- create
- edit
- delete
- view related submission count

When deleting a Website with related submissions:
- prevent deletion
- explain why

UX

- Desktop-first
- Responsive
- Simple navigation
- Clear status indicators
- Fast CRUD workflows
- Avoid unnecessary modals or multi-step flows
- Avoid excessive UI decoration
- The user should be able to perform common actions with minimal clicks
- Empty states should be useful and actionable
- Loading and error states must be handled properly

FIRESTORE

Use Firebase Firestore as the persistent database.

Do not use localStorage as the primary database.

Do not create collections/documents manually just for demo purposes.

Use sensible collection structure, for example:
- androidApps
- websites
- submissions

Use server timestamps where appropriate.

No authentication.

SECURITY

Because this is a private personal tracker without authentication, do not pretend that it has strong user-level access control.

Keep the application architecture ready for authentication to be added later if needed.

Do not expose Firebase credentials as secrets incorrectly. Use the normal Firebase Web SDK configuration approach.

TESTING

Configure Playwright immediately.

Create E2E tests for these critical flows:

1. Application loads successfully.
2. Create an Android App.
3. Create a Website.
4. Create a Submission linking the App and Website.
5. Submission defaults to TODO.
6. Change Submission status.
7. Dashboard reflects the changed status.
8. Edit an App and verify related Submission displays the updated App name.
9. Edit a Website and verify related Submission displays the updated Website name.
10. Attempt to delete an App with related submissions and verify deletion is blocked.
11. Attempt to delete a Website with related submissions and verify deletion is blocked.
12. Delete a Submission and verify it disappears.
13. Prevent duplicate App + Website submissions.

Make tests deterministic and maintainable.

Do not consider the implementation complete until:
- the application builds successfully
- E2E tests are runnable
- E2E tests pass

DEVELOPMENT PROCESS

First:
1. Inspect the repository.
2. Inspect the existing project structure.
3. Set up the React/Vite/TypeScript project if necessary.
4. Set up Firebase.
5. Set up Playwright.
6. Implement the data model and core CRUD.
7. Implement the UI.
8. Implement E2E tests.
9. Run the tests.
10. Fix failures.
11. Verify production build.

Do not over-engineer.

Do not add features that are not required above.

Before making major architectural decisions, prefer the simplest solution that satisfies the requirements.