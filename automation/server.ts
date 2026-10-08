import http from 'node:http';
import { getConfig } from './config.ts';
import { runSubmissionAutomation } from './runner.ts';

const config = getConfig();
let isBusy = false;

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      isBusy,
      supportedSites: ['Active Search Results'],
      config: {
        headless: config.headless,
        hasEmail: Boolean(config.defaultEmail),
      },
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/supported-sites') {
    sendJson(res, 200, {
      sites: ['Active Search Results'],
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/run-submission') {
    if (isBusy) {
      sendJson(res, 429, {
        status: 'FAILED',
        message: 'Another automation job is already running. Please wait for it to finish.',
      });
      return;
    }

    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
      // Guard against huge payload
      if (rawBody.length > 1e6) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(rawBody || '{}');
        const { app, website, submission } = body;

        if (!app || !website) {
          sendJson(res, 400, {
            status: 'FAILED',
            message: 'Invalid payload: both "app" and "website" must be provided.',
          });
          return;
        }

        isBusy = true;
        console.log(`[Automation] Starting submission for "${app.name}" to "${website.name}"...`);

        const result = await runSubmissionAutomation({ app, website, submission }, config);

        console.log(`[Automation] Completed with status: ${result.status} (${result.message})`);
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[Automation] Server error during execution:', err);
        sendJson(res, 500, {
          status: 'FAILED',
          message: err instanceof Error ? err.message : 'Internal server error during automation.',
        });
      } finally {
        isBusy = false;
      }
    });

    req.on('error', (err) => {
      console.error('[Automation] Request stream error:', err);
      sendJson(res, 500, {
        status: 'FAILED',
        message: 'Failed to read request body.',
      });
    });

    return;
  }

  sendJson(res, 404, {
    status: 'FAILED',
    message: 'Endpoint not found',
  });
});

server.listen(config.port, () => {
  console.log(`🚀 Backlink Automation Server running on http://localhost:${config.port}`);
  console.log(`   - Headless mode: ${config.headless}`);
  console.log(`   - Default submission email configured: ${config.defaultEmail ? 'Yes (' + config.defaultEmail + ')' : 'No (please set DEFAULT_SUBMISSION_EMAIL)'}`);
});
