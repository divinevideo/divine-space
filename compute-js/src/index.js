// ABOUTME: Fastly Compute entry point for divine-space
// ABOUTME: Handles SPA routing, subdomains, NIP-05, and name registration

/// <reference types="@fastly/js-compute" />
import { env } from 'fastly:env';
import { KVStore } from 'fastly:kv-store';
import { PublisherServer } from '@fastly/compute-js-static-publish';
import rc from '../static-publish.rc.js';

const publisherServer = PublisherServer.fromStaticPublishRc(rc);

// eslint-disable-next-line no-restricted-globals
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

/**
 * Extract subdomain from hostname
 * @param {string} hostname - e.g., "alice.divine.space"
 * @returns {string|null} - e.g., "alice" or null if apex domain
 */
function getSubdomain(hostname) {
  // Handle local development
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return null;
  }

  // Handle edgecompute.app domains (no subdomains)
  if (hostname.endsWith('.edgecompute.app')) {
    return null;
  }

  // Extract subdomain from divine.space
  const parts = hostname.split('.');
  if (parts.length >= 3 && hostname.endsWith('.divine.space')) {
    const subdomain = parts.slice(0, -2).join('.');
    // Ignore www
    if (subdomain === 'www') {
      return null;
    }
    return subdomain.toLowerCase();
  }

  return null;
}

/**
 * Handle NIP-05 requests
 * @param {URL} url
 * @param {KVStore} namesStore
 * @returns {Promise<Response|null>}
 */
async function handleNip05(url, namesStore) {
  if (url.pathname !== '/.well-known/nostr.json') {
    return null;
  }

  const name = url.searchParams.get('name')?.toLowerCase();

  // If no specific name requested, return empty
  if (!name) {
    return new Response(JSON.stringify({ names: {}, relays: {} }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  // Look up the name in KV store
  const entry = await namesStore.get(`name:${name}`);
  if (!entry) {
    return new Response(JSON.stringify({ names: {}, relays: {} }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  const data = await entry.json();
  const response = {
    names: {
      [name]: data.pubkey,
    },
    relays: data.relays || {},
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

/**
 * Handle name registration API
 * @param {Request} request
 * @param {URL} url
 * @param {KVStore} namesStore
 * @returns {Promise<Response|null>}
 */
async function handleNameRegistration(request, url, namesStore) {
  // POST /api/register-name
  if (url.pathname !== '/api/register-name') {
    return null;
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, pubkey, sig, event } = body;

    // Validate name format (alphanumeric, underscores, hyphens, 3-30 chars)
    const nameRegex = /^[a-z0-9_-]{3,30}$/;
    if (!name || !nameRegex.test(name.toLowerCase())) {
      return new Response(JSON.stringify({
        error: 'Invalid name. Must be 3-30 characters, alphanumeric with underscores/hyphens only.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Validate pubkey format (64 hex chars)
    const pubkeyRegex = /^[a-f0-9]{64}$/;
    if (!pubkey || !pubkeyRegex.test(pubkey.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Invalid pubkey format' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const normalizedName = name.toLowerCase();

    // Check if name is already taken
    const existing = await namesStore.get(`name:${normalizedName}`);
    if (existing) {
      const existingData = await existing.json();
      // Allow owner to update their registration
      if (existingData.pubkey !== pubkey.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Name already taken' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Check reserved names
    const reservedNames = ['www', 'api', 'admin', 'root', 'mail', 'email', 'support', 'help', 'info', 'divine', 'nostr'];
    if (reservedNames.includes(normalizedName)) {
      return new Response(JSON.stringify({ error: 'This name is reserved' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // TODO: Verify Nostr signature to prove ownership of pubkey
    // For now, we trust the request (should add NIP-98 auth or similar)

    // Store the registration
    const registration = {
      pubkey: pubkey.toLowerCase(),
      name: normalizedName,
      registeredAt: Date.now(),
      relays: {
        [pubkey.toLowerCase()]: [
          'wss://relay.divine.video',
          'wss://relay.primal.net',
          'wss://relay.damus.io',
        ],
      },
    };

    await namesStore.put(`name:${normalizedName}`, JSON.stringify(registration));

    // Also store reverse lookup (pubkey -> name)
    await namesStore.put(`pubkey:${pubkey.toLowerCase()}`, JSON.stringify({ name: normalizedName }));

    return new Response(JSON.stringify({
      success: true,
      name: normalizedName,
      nip05: `${normalizedName}@divine.space`,
      subdomain: `${normalizedName}.divine.space`,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * Handle name lookup API
 * @param {Request} request
 * @param {URL} url
 * @param {KVStore} namesStore
 * @returns {Promise<Response|null>}
 */
async function handleNameLookup(request, url, namesStore) {
  // GET /api/lookup-name?name=alice or /api/lookup-name?pubkey=abc123
  if (url.pathname !== '/api/lookup-name') {
    return null;
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const name = url.searchParams.get('name')?.toLowerCase();
  const pubkey = url.searchParams.get('pubkey')?.toLowerCase();

  if (name) {
    const entry = await namesStore.get(`name:${name}`);
    if (!entry) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    const data = await entry.json();
    return new Response(JSON.stringify({
      found: true,
      name: data.name,
      pubkey: data.pubkey,
      nip05: `${data.name}@divine.space`,
      subdomain: `${data.name}.divine.space`,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  if (pubkey) {
    const entry = await namesStore.get(`pubkey:${pubkey}`);
    if (!entry) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    const data = await entry.json();
    return new Response(JSON.stringify({
      found: true,
      name: data.name,
      pubkey: pubkey,
      nip05: `${data.name}@divine.space`,
      subdomain: `${data.name}.divine.space`,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Provide name or pubkey parameter' }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Handle oEmbed requests for video/profile embeds
 * @param {Request} request
 * @param {URL} url
 * @returns {Promise<Response|null>}
 */
async function handleOEmbed(request, url) {
  if (url.pathname !== '/api/oembed') {
    return null;
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const requestUrl = url.searchParams.get('url');
  const maxWidth = parseInt(url.searchParams.get('maxwidth') || '480', 10);
  const maxHeight = parseInt(url.searchParams.get('maxheight') || '854', 10);
  const format = url.searchParams.get('format') || 'json';

  if (!requestUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Only support JSON format
  if (format !== 'json') {
    return new Response(JSON.stringify({ error: 'Only JSON format supported' }), {
      status: 501,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const targetUrl = new URL(requestUrl);
    const pathParts = targetUrl.pathname.split('/').filter(Boolean);

    // Video embed: /video/:id
    if (pathParts[0] === 'video' && pathParts[1]) {
      const videoId = pathParts[1];

      // Fetch video data from the canonical REST API host
      const videoResponse = await fetch(`https://api.divine.video/api/videos/${videoId}`, {
        backend: 'divine_relay',
      });

      if (!videoResponse.ok) {
        return new Response(JSON.stringify({ error: 'Video not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const video = await videoResponse.json();

      const oembedResponse = {
        version: '1.0',
        type: 'video',
        provider_name: 'DiVine Space',
        provider_url: 'https://divine.space',
        title: video.title || 'Video',
        author_name: video.author_name || 'Creator',
        author_url: `https://divine.space/${video.pubkey}`,
        thumbnail_url: video.thumbnail || 'https://divine.space/og-image.svg',
        thumbnail_width: 1280,
        thumbnail_height: 720,
        html: `<iframe src="https://divine.space/embed/${videoId}" width="${Math.min(maxWidth, 480)}" height="${Math.min(maxHeight, 854)}" frameborder="0" allowfullscreen></iframe>`,
        width: Math.min(maxWidth, 480),
        height: Math.min(maxHeight, 854),
      };

      return new Response(JSON.stringify(oembedResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Profile embed - default response
    const oembedResponse = {
      version: '1.0',
      type: 'link',
      provider_name: 'DiVine Space',
      provider_url: 'https://divine.space',
      title: 'DiVine Space - Your MySpace for Videos',
      thumbnail_url: 'https://divine.space/og-image.svg',
      thumbnail_width: 1200,
      thumbnail_height: 630,
    };

    return new Response(JSON.stringify(oembedResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function handleRequest(event) {
  const version = env('FASTLY_SERVICE_VERSION');
  console.log('FASTLY_SERVICE_VERSION', version);

  const request = event.request;
  const url = new URL(request.url);
  const hostname = url.hostname;

  console.log('Request:', hostname, url.pathname);

  // Open the names KV store
  let namesStore;
  try {
    namesStore = new KVStore('divine-space-names');
  } catch (e) {
    console.error('Failed to open names KV store:', e);
  }

  // Redirect www to apex domain
  if (hostname.startsWith('www.')) {
    const newUrl = new URL(url);
    newUrl.hostname = hostname.slice(4);
    return Response.redirect(newUrl.toString(), 301);
  }

  // Handle oEmbed requests
  const oembedResponse = await handleOEmbed(request, url);
  if (oembedResponse) {
    return oembedResponse;
  }

  // Handle NIP-05 requests
  if (namesStore) {
    const nip05Response = await handleNip05(url, namesStore);
    if (nip05Response) {
      return nip05Response;
    }

    // Handle name registration API
    const registerResponse = await handleNameRegistration(request, url, namesStore);
    if (registerResponse) {
      return registerResponse;
    }

    // Handle name lookup API
    const lookupResponse = await handleNameLookup(request, url, namesStore);
    if (lookupResponse) {
      return lookupResponse;
    }
  }

  // Check for subdomain
  const subdomain = getSubdomain(hostname);

  // IMPORTANT: Serve static assets BEFORE subdomain handling
  // This ensures JS, CSS, fonts, images are served correctly on subdomains
  const isStaticAsset = url.pathname.startsWith('/assets/') ||
                        url.pathname.endsWith('.js') ||
                        url.pathname.endsWith('.css') ||
                        url.pathname.endsWith('.woff') ||
                        url.pathname.endsWith('.woff2') ||
                        url.pathname.endsWith('.ttf') ||
                        url.pathname.endsWith('.svg') ||
                        url.pathname.endsWith('.png') ||
                        url.pathname.endsWith('.jpg') ||
                        url.pathname.endsWith('.ico') ||
                        url.pathname.endsWith('.webp') ||
                        url.pathname.endsWith('.webmanifest') ||
                        url.pathname === '/manifest.webmanifest' ||
                        url.pathname === '/robots.txt' ||
                        url.pathname === '/favicon.ico';

  if (isStaticAsset) {
    const response = await publisherServer.serveRequest(request);
    if (response != null) {
      return response;
    }
  }

  if (subdomain && namesStore) {
    console.log('Subdomain detected:', subdomain);

    // Look up the subdomain in KV store
    const entry = await namesStore.get(`name:${subdomain}`);

    // Open content KV store to read index file directly
    // The publisherServer doesn't work with subdomain requests
    let contentStore;
    try {
      contentStore = new KVStore('divine-space-content');
    } catch (e) {
      console.error('Failed to open content KV store:', e);
      return new Response('Error: Cannot access content store', { status: 500 });
    }

    // Read the index file that maps paths to content hashes
    // Note: The collection name is 'undefined' due to a quirk in how the static publisher was set up
    const indexEntry = await contentStore.get('default_index_undefined');
    if (!indexEntry) {
      console.error('Index file not found in KV store');
      return new Response('Error: Index not found', { status: 500 });
    }

    const indexData = await indexEntry.json();

    // Find the index.html entry in the index - structure is { '/path': { key: 'sha256:...', ... } }
    const indexHtmlInfo = indexData['/index.html'];
    if (!indexHtmlInfo) {
      console.error('index.html not found in index');
      return new Response('Error: index.html not found', { status: 500 });
    }

    // Get the content hash for index.html - key format is "sha256:HASH"
    const contentHash = indexHtmlInfo.key.replace('sha256:', '');
    const contentKey = `default_files_sha256_${contentHash}`;

    // Read the actual HTML content
    const htmlEntry = await contentStore.get(contentKey);
    if (!htmlEntry) {
      console.error('HTML content not found:', contentKey);
      return new Response('Error: HTML content not found', { status: 500 });
    }

    const html = await htmlEntry.text();
    if (!html || html.length === 0) {
      console.error('Empty HTML content');
      return new Response('Error: Empty HTML', { status: 500 });
    }

    // Inject the subdomain data into HTML
    if (entry) {
      // User found - inject their data
      const data = await entry.json();
      console.log('Found user for subdomain:', subdomain, data.pubkey);

      const injectedHtml = html.replace(
        '<head>',
        `<head>
    <script>
      window.__DIVINE_SPACE_USER__ = {
        subdomain: "${subdomain}",
        pubkey: "${data.pubkey}",
        nip05: "${subdomain}@divine.space"
      };
    </script>`
      );

      return new Response(injectedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      });
    } else {
      // Subdomain not registered - show claim page
      console.log('Subdomain not registered:', subdomain);

      const injectedHtml = html.replace(
        '<head>',
        `<head>
    <script>
      window.__DIVINE_SPACE_UNCLAIMED__ = {
        subdomain: "${subdomain}"
      };
    </script>`
      );

      return new Response(injectedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }
  }

  // Serve static content with SPA fallback
  const response = await publisherServer.serveRequest(request);
  if (response != null) {
    return response;
  }

  return new Response('Not Found', { status: 404 });
}
