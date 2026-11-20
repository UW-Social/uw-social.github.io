// A Route Worker in front of the existing GitHub Pages origin, not a new host.
const pagePaths = [
  /^\/(?:events|clubs|forum|forums|score-framework|ai-consultant)\/?$/,
  /^\/(?:events|clubs|forums)\/[^/.]+\/?$/,
  /^\/forum\/posts\/[^/.]+\/[^/.]+\/?$/,
  /^\/(?:login|profile|mailbox|onboarding|publish)\/?$/,
  /^\/profile\/edit\/?$/,
  /^\/events\/[^/.]+\/edit\/?$/,
  /^\/forum\/new\/?$/,
  /^\/admin\/imports\/?$/,
];

export function createSiteRouter(originFetch = fetch) {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      const isPage = (request.method === 'GET' || request.method === 'HEAD')
        && pagePaths.some(pattern => pattern.test(url.pathname));

      // Do not turn missing assets, API requests or unknown URLs into HTML/200.
      if (!isPage) return originFetch(request);

      // Same-zone fetch from a Route Worker goes to the DNS origin. Keep the
      // public hostname: fetching github.io would redirect to the custom domain.
      url.pathname = '/index.html';
      url.search = '';
      const headers = new Headers(request.headers);
      for (const name of ['if-none-match', 'if-modified-since', 'range', 'if-range']) {
        headers.delete(name);
      }
      const response = await originFetch(new Request(url, {
        method: request.method,
        headers,
        redirect: 'manual',
      }));
      // Preserve origin failures; never disguise a missing deployment as success.
      if (!response.ok) return response;
      const resultHeaders = new Headers(response.headers);
      resultHeaders.set('Cache-Control', 'no-cache');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resultHeaders,
      });
    },
  };
}

export default createSiteRouter();
