import fs from 'fs';
import path from 'path';

const BOT_AGENTS = [
  'whatsapp', 'facebookexternalhit', 'facebot', 'twitterbot',
  'linkedinbot', 'telegrambot', 'discordbot', 'slackbot',
  'googlebot', 'bingbot', 'applebot', 'pinterest',
  'redditbot', 'vkshare', 'w3c_validator', 'curl', 'wget',
];

const DEFAULT_OG_IMAGE = 'https://kolhapur-maza.vercel.app/og-image.png';
const SITE_URL = 'https://kolhapur-maza.vercel.app';

function isBot(userAgent = '') {
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some(bot => ua.includes(bot));
}

export default async function handler(req, res) {
  const { slug } = req.query;
  const userAgent = req.headers['user-agent'] || '';

  // For real users (non-bots), serve the React SPA (index.html)
  if (!isBot(userAgent)) {
    try {
      const indexPath = path.join(process.cwd(), 'dist', 'index.html');
      const html = fs.readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch {
      // If dist/index.html not found, redirect to homepage (not the same slug URL to avoid loops)
      res.setHeader('Location', '/');
      return res.status(302).end();
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let title = 'KopMaza News';
  let description = 'कोल्हापूर माझा - शैक्षणिक, राजकीय, सामाजिक बातम्या';
  let image = DEFAULT_OG_IMAGE;
  let articleUrl = `${SITE_URL}/news/${slug}`;

  if (slug && supabaseUrl && supabaseKey) {
    try {
      const apiUrl = `${supabaseUrl}/rest/v1/news?slug=eq.${encodeURIComponent(slug)}&select=title,short_description,featured_image&limit=1`;
      const response = await fetch(apiUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      const data = await response.json();
      if (data && data.length > 0) {
        title = data[0].title || title;
        description = data[0].short_description || description;
        image = data[0].featured_image || DEFAULT_OG_IMAGE;
      }
    } catch (e) {
      console.error('Error fetching OG data:', e);
    }
  }

  const escapeHtml = (unsafe) =>
    (unsafe || '').replace(/[&<"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '"': return '&quot;';
        default: return '&#039;';
      }
    });

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(articleUrl);

  const html = `<!DOCTYPE html>
<html lang="mr">
  <head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}">
    <meta property="og:site_name" content="KopMaza News">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:secure_url" content="${safeImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${safeImage}">
    <link rel="canonical" href="${safeUrl}">
  </head>
  <body>
    <p>${safeTitle}</p>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  res.status(200).send(html);
}
