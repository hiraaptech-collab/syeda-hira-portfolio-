import { seoPages } from './data/seoPages'
import { profile, socials } from './data/profile'

const previewPath = '/social-preview.png'

function setMeta(selector, attribute, key, value) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = value
}

export function syncPageSeo(pathname) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  const page = seoPages[normalizedPath] || {
    title: 'Page not found | Syeda Hira',
    description: 'The requested page could not be found on Syeda Hira’s Full Stack Developer portfolio.',
  }
  const configuredOrigin = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
  const currentOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : window.location.origin
  const origin = configuredOrigin || currentOrigin
  const pageUrl = origin ? new URL(normalizedPath === '/' ? '' : normalizedPath.slice(1), `${origin}/`).toString().replace(/\/$/, normalizedPath === '/' ? '/' : '') : ''
  const imageUrl = origin ? `${origin}${previewPath}` : previewPath
  const robots = seoPages[normalizedPath] ? 'index,follow,max-image-preview:large' : 'noindex,follow'

  document.title = page.title
  setMeta('meta[name="description"]', 'name', 'description', page.description)
  setMeta('meta[name="robots"]', 'name', 'robots', robots)
  setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Syeda Hira — Full Stack Developer')
  setMeta('meta[property="og:title"]', 'property', 'og:title', page.title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', page.description)
  setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl)
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', page.title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', page.description)
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl)

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (pageUrl) {
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = pageUrl
    setMeta('meta[property="og:url"]', 'property', 'og:url', pageUrl)
  } else {
    canonical?.remove()
    document.head.querySelector('meta[property="og:url"]')?.remove()
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressCountry: 'PK' },
    email: profile.emailHref,
    sameAs: socials.map(social => social.url),
    ...(origin ? { url: origin } : {}),
  }
  let jsonLd = document.head.querySelector('script[data-portfolio-jsonld]')
  if (!jsonLd) {
    jsonLd = document.createElement('script')
    jsonLd.type = 'application/ld+json'
    jsonLd.dataset.portfolioJsonld = 'true'
    document.head.append(jsonLd)
  }
  jsonLd.textContent = JSON.stringify(structuredData)
}
