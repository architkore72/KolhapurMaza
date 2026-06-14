export default async function handler(req, res) {
  const { slug } = req.query;
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let title = 'KopMaza News';
  let description = 'Latest News & Updates';
  let image = '';

  if (slug && supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/news?slug=eq.${slug}&select=title,short_description,featured_image&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        title = data[0].title;
        description = data[0].short_description || description;
        image = data[0].featured_image;
      }
    } catch (e) {
      console.error('Error fetching OG data:', e);
    }
  }

  // Escape HTML to prevent injection
  const escapeHtml = (unsafe) => {
    return (unsafe || '').replace(/[&<"']/g, function(m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '"': return '&quot;';
        default: return '&#039;';
      }
    });
  };

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeSlug = escapeHtml(slug);

  const html = `
    <!DOCTYPE html>
    <html lang="mr">
      <head>
        <meta charset="utf-8">
        <title>${safeTitle}</title>
        <meta property="og:site_name" content="KopMaza News">
        <meta property="og:type" content="article">
        <meta property="og:title" content="${safeTitle}">
        <meta property="og:description" content="${safeDesc}">
        ${safeImage ? `<meta property="og:image" content="${safeImage}">` : ''}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${safeTitle}">
        <meta name="twitter:description" content="${safeDesc}">
        ${safeImage ? `<meta name="twitter:image" content="${safeImage}">` : ''}
        
        <script>
          // Redirect actual users to the real React app route
          window.location.replace('/news/${safeSlug}');
        </script>
      </head>
      <body>
        <p>Redirecting to article...</p>
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
