import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seoPages, siteNavigation } from '../src/data/seoPages.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const siteUrl = (process.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
if (siteUrl && !/^https?:\/\//i.test(siteUrl)) throw new Error('VITE_SITE_URL must be an absolute http(s) URL')
const profile = {
  name: 'Syeda Hira',
  jobTitle: 'Full Stack Developer',
  locality: 'Karachi',
  country: 'PK',
  email: 'hiraaptech@gmail.com',
  sameAs: [
    'https://github.com/hiraaptech-collab',
    'https://www.instagram.com/twinstackdigital/',
    'https://www.facebook.com/profile.php?id=61595349290304',
  ],
}
const previewPath = '/social-preview.png'
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const baseHtml = await readFile(path.join(dist, 'index.html'), 'utf8')
const links = siteNavigation.map(([route, label]) => `<li><a href="${route}">${escapeHtml(label)}</a></li>`).join('')

for (const [route, page] of Object.entries(seoPages)) {
  const absoluteUrl = siteUrl ? new URL(route.replace(/^\//, ''), `${siteUrl}/`).toString().replace(/\/$/, route === '/' ? '/' : '') : ''
  const canonical = absoluteUrl ? `<link rel="canonical" href="${escapeHtml(absoluteUrl)}" />` : ''
  const socialImage = siteUrl ? `${siteUrl}${previewPath}` : previewPath
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.jobTitle,
    address: { '@type': 'PostalAddress', addressLocality: profile.locality, addressCountry: profile.country },
    email: `mailto:${profile.email}`,
    sameAs: profile.sameAs,
    ...(siteUrl ? { url: siteUrl } : {}),
  }
  const head = `<title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    ${canonical}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Syeda Hira — Full Stack Developer" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:image" content="${escapeHtml(socialImage)}" />
    ${absoluteUrl ? `<meta property="og:url" content="${escapeHtml(absoluteUrl)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
    <script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`
  const main = `<main id="main-content" tabindex="-1"><section aria-labelledby="route-heading"><p>Syeda Hira · Full Stack Developer · Karachi, Pakistan</p><h1 id="route-heading">${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p><nav aria-label="Portfolio pages"><ul>${links}</ul></nav></section></main>`
  let html = baseHtml.replace(/<title>[\s\S]*?<\/title>/, '')
  html = html.replace(/<meta\b[^>]*>/gi, tag => {
    const key = tag.match(/\b(?:name|property)="([^"]+)"/i)?.[1] || ''
    return key === 'description' || key === 'robots' || key.startsWith('og:') || key.startsWith('twitter:') ? '' : tag
  })
  html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '')
  html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
  html = html.replace('</head>', `${head}\n  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${main}</div>`)
  const outputPath = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html')
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html)
}

const robots = `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`
await writeFile(path.join(dist, 'robots.txt'), robots)
if (siteUrl) {
  const urls = Object.keys(seoPages).map(route => {
    const loc = new URL(route.replace(/^\//, ''), `${siteUrl}/`).toString().replace(/\/$/, route === '/' ? '/' : '')
    return `  <url><loc>${escapeHtml(loc)}</loc></url>`
  }).join('\n')
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
  console.log(`Generated canonical URLs and sitemap for ${siteUrl}`)
} else {
  console.warn('VITE_SITE_URL is unset; built route pages omit canonical URLs and sitemap.xml. Set it to the final Bluehost origin before deployment.')
}
