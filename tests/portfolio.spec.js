import { expect, test } from '@playwright/test'

const projectUrls = [
  'https://aptechmetrostargate.com:205',
  'https://fantastic-rugelach-427ed4.netlify.app',
  'https://lumiere-gamma-two.vercel.app',
  'https://fit-fusion-web-application.onrender.com',
]

async function openPage(page, path = '/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.loader')).toHaveCount(0)
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))
  expect(overflow, 'The page must fit within the viewport').toBeLessThanOrEqual(1)
}

test('all six routes expose unique professional SEO metadata', async ({ page }) => {
  test.setTimeout(120_000)
  const paths = ['/', '/about', '/projects', '/skills', '/education', '/contact']
  const titles = new Set()
  for (const route of paths) {
    for (const directRoute of [route, route === '/' ? route : `${route}/`]) {
      await openPage(page, directRoute)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Syeda Hira/)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,follow/)
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Syeda Hira/)
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.png/)
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
      titles.add(await page.title())
    }
  }
  expect(titles.size).toBe(6)
  const preview = await page.request.get('/social-preview.png')
  expect(preview.ok()).toBe(true)
  expect(preview.headers()['content-type']).toContain('image/png')
  const image = await preview.body()
  expect(image.readUInt32BE(16)).toBe(1200)
  expect(image.readUInt32BE(20)).toBe(630)
})

test('all six routes have their own heading and a single main landmark', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const routes = [
    ['/', /Syeda\s*Hira/],
    ['/about', 'Curious by nature. Full Stack Developer by passion.'],
    ['/projects', 'Original projects, brought to life.'],
    ['/skills', 'A versatile full-stack foundation.'],
    ['/education', 'Always learning. Always building.'],
    ['/contact', "Let's Build Something Extraordinary."],
  ]
  const sceneKinds = { '/about': 'about', '/projects': 'projects', '/skills': 'skills', '/education': 'education', '/contact': 'contact' }
  sceneKinds['/'] = 'home'

  for (const [path, heading] of routes) {
    await openPage(page, path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.locator('#main-content')).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Hire Me, go to Contact' })).toHaveAttribute('href', '/contact')
    if (sceneKinds[path]) await expect(page.locator(`[data-scene-kind="${sceneKinds[path]}"] canvas`)).toBeVisible()
    await expectNoHorizontalOverflow(page)
  }
  expect(errors, 'Routes should render without uncaught browser errors').toEqual([])
})

test('all six pages fit target viewport widths without horizontal overflow', async ({ page }) => {
  test.setTimeout(300_000)
  const routes = ['/', '/about', '/projects', '/skills', '/education', '/contact']
  const widths = [320, 375, 390, 768, 1024, 1920]
  const measure = async (route, width, position) => {
    const result = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth
      const bodyRect = document.body.getBoundingClientRect()
      const offenders = [...document.body.querySelectorAll('*')].map(element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          position: style.position,
          overflowX: style.overflowX,
        }
      }).filter(item => item.width > 1 && (item.left < bodyRect.left - 1 || item.right > bodyRect.right + 1))
        .sort((a, b) => Math.max(Math.abs(b.left), Math.abs(b.right - viewport)) - Math.max(Math.abs(a.left), Math.abs(a.right - viewport)))
        .slice(0, 12)
      return {
        viewport,
        bodyBounds: { left: bodyRect.left, right: bodyRect.right, width: bodyRect.width },
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        layoutViewportWidth: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-viewport-width')),
        pageHeroBounds: (() => {
          const hero = document.querySelector('.page-intro')
          if (!hero) return null
          const rect = hero.getBoundingClientRect()
          return { left: rect.left, right: rect.right }
        })(),
        offenders,
      }
    })
    if (result.scrollWidth > result.viewport + 1 || result.bodyScrollWidth > result.bodyBounds.width + 1) {
      console.log(`Horizontal overflow: ${route} ${width}px ${position}: ${JSON.stringify(result)}`)
    }
    expect(result.scrollWidth, `${route} at ${width}px (${position})`).toBeLessThanOrEqual(result.viewport + 1)
    expect(result.bodyScrollWidth, `${route} at ${width}px must fit the usable layout width (${position}): ${JSON.stringify(result)}`).toBeLessThanOrEqual(result.bodyBounds.width + 1)
    expect(result.layoutViewportWidth, `${route} at ${width}px must use the usable layout width (${position})`).toBe(result.bodyBounds.width)
    if (result.pageHeroBounds) {
      expect(result.pageHeroBounds.left, `${route} hero left edge at ${width}px (${position}): ${JSON.stringify(result.pageHeroBounds)}`).toBeGreaterThanOrEqual(result.bodyBounds.left - 1)
      expect(result.pageHeroBounds.right, `${route} hero right edge at ${width}px (${position})`).toBeLessThanOrEqual(result.bodyBounds.right + 1)
    }
  }

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 960 })
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('.loader')).toHaveCount(0, { timeout: 12_000 })
      // Simulate classic Windows scrollbars: 100vw includes the scrollbar
      // track, while the document's usable layout width does not.
      await page.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' })
      await page.evaluate(() => window.dispatchEvent(new Event('resize')))
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await measure(route, width, 'top')

      const scene = page.locator('[data-scene-kind]').first()
      if (await scene.count()) {
        const trigger = await scene.evaluate(node => ({
          start: Math.max(0, node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12),
          distance: Number(node.dataset.sceneDistance),
        }))
        await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.55, behavior: 'instant' }), trigger)
        await measure(route, width, 'pinned scene')
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
        await measure(route, width, 'page bottom')
      }
    }
  }
})

test('all six routes use edge-to-edge image heroes with text directly over the artwork', async ({ page }) => {
  test.setTimeout(180_000)
  const routes = ['/', '/about', '/projects', '/skills', '/education', '/contact']
  for (const route of routes) {
    await openPage(page, route)
    const hero = page.locator('[data-cinematic-hero]')
    await expect(hero).toHaveCount(1)
    const widths = [320, 360, 375, 390, 430, 768, 1024, 1440, 1920]
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 500 ? 800 : width < 800 ? 1024 : 960 })
      const result = await hero.evaluate(node => {
        const style = getComputedStyle(node, '::before')
        const bounds = node.getBoundingClientRect()
        const heading = node.querySelector('h1')
        return {
          image: style.backgroundImage,
          heroWidth: bounds.width,
          viewportWidth: document.documentElement.clientWidth,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          headingInsideHero: Boolean(heading && node.contains(heading)),
          headingCard: Boolean(heading?.closest('.wavy-card, .glass-card, .page-intro-card')),
          headingText: heading?.getAttribute('aria-label') || heading?.textContent?.replace(/\s+/g, ' ').trim(),
        }
      })
      expect(result.image, `${route} at ${width}px must load an image background`).toContain('/hero/')
      expect(result.heroWidth).toBeGreaterThanOrEqual(result.viewportWidth - 1)
      expect(result.headingInsideHero).toBe(true)
      expect(result.headingCard).toBe(false)
      expect(result.headingText).toMatch(/\w\s+\w/)
      expect(result.overflow, `${route} at ${width}px must not overflow horizontally`).toBeLessThanOrEqual(1)
    }
  }
})

test('homepage has NO project cards or gallery, while Projects page has all 4 projects', async ({ page }) => {
  await openPage(page, '/')
  // Priority 1 verification: absolutely zero project cards on homepage
  await expect(page.locator('.hero')).toBeVisible()
  const homeScene = page.locator('[data-scene-kind="home"]')
  await expect(homeScene.locator('canvas')).toBeVisible()
  await expect(homeScene).toHaveAttribute('data-scene-control', 'autoplay')
  await expect(homeScene).toHaveAttribute('data-scene-pinned', 'false')
  await expect(homeScene).toHaveAttribute('data-scene-duration', '9.5')
  await expect(homeScene).toHaveAttribute('data-scene-started', 'true')
  const initialScrollY = await page.evaluate(() => window.scrollY)
  await expect.poll(async () => Number(await homeScene.getAttribute('data-scene-progress')), { timeout: 15000 }).toBeGreaterThan(0.98)
  expect(await page.evaluate(() => window.scrollY)).toBe(initialScrollY)
  await expect(homeScene).toHaveAttribute('data-scene-progress', '1.000')
  await page.waitForTimeout(350)
  await expect(homeScene).toHaveAttribute('data-scene-progress', '1.000')
  await expect(page.locator('.character-model-placeholder')).toHaveCount(0)
  await expect(page.locator('.hero-character-image')).toHaveCount(0)
  await expect(page.locator('.approved-character-showcase')).toHaveCount(0)
  await expect(page.locator('.project-card')).toHaveCount(0)
  await expect(page.locator('.project-grid')).toHaveCount(0)

  // Navigate to projects
  await page.getByRole('link', { name: 'Explore My Work', exact: true }).click()
  await expect(page).toHaveURL('/projects')
  await expect(page.locator('.project-card')).toHaveCount(4)
})

test('active navigation and homepage project/contact calls to action work', async ({ page }) => {
  await openPage(page)
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true })
  await expect(navigation.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page')

  await page.getByRole('link', { name: 'Explore My Work', exact: true }).click()
  await expect(page).toHaveURL('/projects')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Original projects, brought to life.')
  await expect(navigation.getByRole('link', { name: 'Projects', exact: true })).toHaveAttribute('aria-current', 'page')

  await page.getByRole('link', { name: 'Syeda Hira home', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.locator('#main-content').getByRole('link', { name: 'Hire Me', exact: true }).click()
  await expect(page).toHaveURL('/contact')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Let's Build Something Extraordinary.")
  await expect(page.getByText('Your vision. My code. Endless possibilities.')).toBeVisible()
})

test('Hire Me is available and reaches Contact on desktop and mobile navigation', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await openPage(page, '/projects')
    if (viewport.width > 1100) {
      const hireLink = page.getByRole('link', { name: 'Hire Me, go to Contact' })
      await hireLink.click()
    } else {
      await page.getByRole('button', { name: 'Open menu', exact: true }).click()
      const menu = page.getByRole('navigation', { name: 'Mobile navigation', exact: true })
      await menu.getByRole('link', { name: 'Hire Me', exact: true }).click()
      await expect(menu).toHaveCount(0)
    }
    await expect(page).toHaveURL('/contact')
  }
})

test('loader stays visible for its brief first-visit presentation and fades away', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem('sh_intro_seen'))
  const started = Date.now()
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.loader')).toBeVisible()
  await expect(page.locator('.loader')).toHaveCount(0, { timeout: 12000 })
  expect(Date.now() - started).toBeGreaterThanOrEqual(2800)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('Home hero hands off without a blank frame on first visit, refresh, and repeat visit at desktop and mobile', async ({ page }) => {
  test.setTimeout(90_000)
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('__home_intro_test_started')) {
      sessionStorage.removeItem('sh_intro_seen')
      sessionStorage.setItem('__home_intro_test_started', 'true')
    }
  })

  const verifyHandoff = async (visit, width) => {
    const loader = page.locator('.loader')
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading, `${visit} at ${width}px: heading stays rendered behind the loader`).toBeVisible()
    await expect(loader).toBeVisible()
    await expect(loader).toHaveCount(0, { timeout: 12000 })
    await expect(page.locator('[data-cinematic-hero="home"]')).toBeVisible()
    await expect(heading).toBeVisible()
    await expect.poll(async () => Number(await heading.locator(':scope > span').first().evaluate(node => getComputedStyle(node).opacity))).toBeGreaterThan(0.98)
    await expectNoHorizontalOverflow(page)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await verifyHandoff('first visit', 1440)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await verifyHandoff('refresh', 1440)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => sessionStorage.removeItem('sh_intro_seen'))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await verifyHandoff('first mobile visit', 390)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await verifyHandoff('repeat mobile visit', 390)
})

test('glass navigation and the shared starfield respond across scroll and stay non-interactive', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openPage(page, '/about')
  const nav = page.locator('.site-header')
  const initialBlur = await nav.evaluate(node => getComputedStyle(node).backdropFilter)
  expect(initialBlur).toContain('blur')
  const stars = page.locator('.starfield')
  await expect(stars).toBeAttached()
  expect(await stars.evaluate(node => getComputedStyle(node).pointerEvents)).toBe('none')
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }))
  await expect(nav).toHaveClass(/is-scrolled/)
})

test('React and MariaDB are absent from public skill and technology content', async ({ page }) => {
  for (const route of ['/', '/about', '/projects', '/skills', '/education', '/contact']) {
    await openPage(page, route)
    const publicText = await page.locator('body').innerText()
    expect(publicText, `${route} should not advertise React or MariaDB`).not.toMatch(/\bReact\b|\bMariaDB\b/i)
  }
})

test('mobile layout renders the procedural workspace and navigation closes correctly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openPage(page)
  const homeCanvas = page.locator('[data-scene-kind="home"] canvas')
  await expect(homeCanvas).toBeVisible()
  expect(await homeCanvas.evaluate(canvas => canvas.width > 0 && canvas.height > 0 && Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')))).toBe(true)
  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation', exact: true })
  await expect(mobileNavigation).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close menu', exact: true })).toHaveAttribute('aria-expanded', 'true')
  await expectNoHorizontalOverflow(page)
  await page.keyboard.press('Escape')
  await expect(mobileNavigation).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeFocused()

  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  await mobileNavigation.getByRole('link', { name: /Projects/ }).click()
  await expect(page).toHaveURL('/projects')
  await expect(mobileNavigation).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toHaveAttribute('aria-expanded', 'false')
  await expectNoHorizontalOverflow(page)
})

test('reduced motion dismisses the loader and disables the custom cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPage(page)
  await page.mouse.move(250, 200)
  await expect(page.locator('.custom-cursor')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Explore My Work', exact: true })).toBeVisible()
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
  await openPage(page, '/about')
  await expect(page.locator('[data-scene-kind="about"]')).toHaveAttribute('data-scene-active', 'false')
})

test('contact provides the supplied direct links and social profiles without a form', async ({ page }) => {
  await openPage(page, '/contact')
  const main = page.getByRole('main')
  await expect(main.getByRole('link', { name: 'hiraaptech@gmail.com', exact: true })).toHaveAttribute('href', 'mailto:hiraaptech@gmail.com')
  await expect(main.getByRole('link', { name: '+92 3103701543', exact: true })).toHaveAttribute('href', 'tel:+923103701543')
  const socials = [
    ['GitHub', 'https://github.com/hiraaptech-collab'],
    ['Instagram', 'https://www.instagram.com/twinstackdigital/'],
    ['Facebook', 'https://www.facebook.com/profile.php?id=61595349290304'],
  ]
  for (const [name, url] of socials) {
    await expect(main.getByRole('link', { name, exact: true })).toHaveAttribute('href', url)
  }
  await expect(page.locator('a[href*="linkedin.com"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /linkedin/i })).toHaveCount(0)
  await expect(page.locator('form')).toHaveCount(0)
  await expect(main.getByText('Karachi, Pakistan', { exact: true })).toBeVisible()
})

test('project cards use the supplied live URLs and display original screenshots', async ({ page }) => {
  await openPage(page, '/projects')
  await expect(page.locator('[data-scene-kind="projects"] canvas')).toBeVisible()
  const cards = page.getByRole('main').locator('.project-card')
  await expect(cards).toHaveCount(4)
  for (let index = 0; index < projectUrls.length; index += 1) {
    const card = cards.nth(index)
    const liveLink = card.locator('a.project-cover')
    await expect(liveLink).toHaveAttribute('href', projectUrls[index])
    await expect(liveLink).toHaveAttribute('target', '_blank')
    await expect(liveLink).toHaveAttribute('rel', /noopener/)
    await expect(card.locator('.project-screenshot-img')).toBeVisible()
  }
})

test('WebGL being unavailable preserves usable content and finishes loading', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (contextType, ...args) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(contextType)) return null
      return Reflect.apply(originalGetContext, this, [contextType, ...args])
    }
  })
  await openPage(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Syeda\s*Hira/)
  await expect(page.locator('[data-scene-kind="home"]')).toBeVisible()
  await expect(page.locator('.character-model-placeholder')).toHaveCount(0)
  await page.getByRole('link', { name: 'Explore My Work', exact: true }).click()
  await expect(page).toHaveURL('/projects')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Original projects, brought to life.')
  expect(errors, 'Unsupported WebGL should be handled without an uncaught exception').toEqual([])
})

test('Contact loads its separate 3D collaboration scene', async ({ page }) => {
  await openPage(page, '/contact')
  const scene = page.locator('[data-scene-kind="contact"]')
  await expect(scene.locator('canvas')).toBeVisible()
  await expect(scene).toContainText('INCOMING CALL / CREATIVE COLLABORATION')
})

test('Contact phone rings, connects, reveals messages, and holds on desktop and mobile', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await openPage(page, '/contact')
    const scene = page.locator('[data-scene-kind="contact"]')
    const trigger = await scene.evaluate(node => {
      const sceneTop = node.getBoundingClientRect().top + window.scrollY
      const distance = Number(node.dataset.sceneDistance)
      return { start: Math.max(0, sceneTop - window.innerHeight * 0.12), distance }
    })
    const scrubTo = (fraction) => page.evaluate(({ y, distance, fraction }) => window.scrollTo({ top: y + distance * fraction, behavior: 'instant' }), { y: trigger.start, distance: trigger.distance, fraction })

    await scrubTo(0.25)
    await expect(scene).toHaveAttribute('data-contact-stage', 'ringing')
    await scrubTo(0.5)
    await expect(scene).toHaveAttribute('data-contact-stage', 'connected')
    await scrubTo(0.62)
    await expect(scene).toHaveAttribute('data-contact-stage', 'messages')
    await scrubTo(0.9)
    await expect(scene).toHaveAttribute('data-scene-progress', '1.000')
    await expect(scene).toHaveAttribute('data-scene-pinned', 'true')
    await expectNoHorizontalOverflow(page)
  }
})

test('Contact phone completes a reversible 360-degree turn after the messages stay readable', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await openPage(page, '/contact')
    const scene = page.locator('[data-scene-kind="contact"]')
    const { start, distance } = await scene.evaluate(node => ({
      start: Math.max(0, node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12),
      distance: Number(node.dataset.sceneDistance),
    }))
    const seek = fraction => page.evaluate(({ start, distance, fraction }) => window.scrollTo({ top: start + distance * fraction, behavior: 'instant' }), { start, distance, fraction })
    await seek(0.68)
    await expect(scene).toHaveAttribute('data-contact-stage', 'messages')
    await expect(scene).toHaveAttribute('data-contact-rotation-degrees', '0')
    await seek(0.91)
    await expect.poll(async () => Number(await scene.getAttribute('data-contact-rotation-degrees'))).toBeGreaterThan(180)
    await seek(0.99)
    await expect(scene).toHaveAttribute('data-contact-rotation-degrees', '360')
    await expect(scene).toHaveAttribute('data-scene-pinned', 'true')
    await seek(0.7)
    await expect.poll(async () => Number(await scene.getAttribute('data-contact-rotation-degrees'))).toBeLessThan(180)
  }
})

test('Education shows the corrected DISM diploma and preserves its other entries after refresh', async ({ page }) => {
  await openPage(page, '/education')
  const timelines = page.locator('.education-experience-grid .timeline')
  const educationTimeline = timelines.nth(0)
  await expect(educationTimeline.locator('.timeline-item')).toHaveCount(3)
  await expect(educationTimeline).toContainText('DISM — Diploma in Information System Management')
  await expect(educationTimeline).not.toContainText(/ACCP|Advanced Diploma in Software Engineering|Specialized Full Stack & AI Software Curriculum/)
  await expect(timelines.nth(1).locator('.timeline-item')).toHaveCount(2)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(educationTimeline).toContainText('DISM — Diploma in Information System Management')
})

test('Education builds and turns its 3D books through 180 degrees on desktop and mobile', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await openPage(page, '/education')
    const scene = page.locator('[data-scene-kind="education"]')
    await expect(scene).toHaveAttribute('data-scene-control', 'scroll')
    const { start, distance } = await scene.evaluate(node => ({
      start: Math.max(0, node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12),
      distance: Number(node.dataset.sceneDistance),
    }))
    await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.58, behavior: 'instant' }), { start, distance })
    await expect.poll(async () => Number(await scene.getAttribute('data-book-turn-degrees'))).toBeGreaterThan(90)
    await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.99, behavior: 'instant' }), { start, distance })
    await expect(scene).toHaveAttribute('data-book-turn-degrees', '180')
    await expect(scene).toHaveAttribute('data-scene-pinned', 'true')
  }
})

test('Skills scene reveals all seven named technology logos and completes its orbit', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await openPage(page, '/skills')
    const scene = page.locator('[data-scene-kind="skills"]')
    await expect(scene).toHaveAttribute('data-tech-logos', 'HTML5,CSS3,JavaScript,Bootstrap,PHP,Laravel,MySQL')
    const { start, distance } = await scene.evaluate(node => ({
      start: Math.max(0, node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12),
      distance: Number(node.dataset.sceneDistance),
    }))
    await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.52, behavior: 'instant' }), { start, distance })
    await expect.poll(async () => Number(await scene.getAttribute('data-skill-orbit-degrees'))).toBeGreaterThan(150)
    await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.99, behavior: 'instant' }), { start, distance })
    await expect(scene).toHaveAttribute('data-skill-orbit-degrees', '360')
    await expect(scene).toHaveAttribute('data-scene-pinned', 'true')
  }
})

test('the five non-home scenes pin, complete, hold, and reverse on desktop and mobile', async ({ page }) => {
  test.setTimeout(180_000)
  const routes = ['/about', '/projects', '/skills', '/education', '/contact']
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const route of routes) {
      await page.setViewportSize(viewport)
      await openPage(page, route)
      const scene = page.locator('[data-scene-kind]')
      await expect(scene).toHaveAttribute('data-scene-control', 'scroll')
      const trigger = await scene.evaluate(node => {
        const sceneTop = node.getBoundingClientRect().top + window.scrollY
        const distance = Number(node.dataset.sceneDistance)
        const start = Math.max(0, sceneTop - window.innerHeight * 0.12)
        return { start, distance }
      })
      expect(trigger.distance).toBeGreaterThan(viewport.height * 3)

      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), Math.ceil(trigger.start + 80))
      await expect(scene).toHaveAttribute('data-scene-pinned', 'true')
      await expect.poll(async () => scene.evaluate(node => Math.abs(node.getBoundingClientRect().top - window.innerHeight * 0.12))).toBeLessThan(4)
      await expect.poll(async () => scene.getAttribute('data-scene-active')).toBe('true')
      await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.4, behavior: 'instant' }), trigger)
      await expect.poll(async () => Number(await scene.getAttribute('data-scene-progress'))).toBeGreaterThan(0.35)
      await expect.poll(async () => Number(await scene.getAttribute('data-scene-progress'))).toBeLessThan(0.7)

      await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.72, behavior: 'instant' }), trigger)
      await expect.poll(async () => Number(await scene.getAttribute('data-scene-progress'))).toBeGreaterThan(0.8)
      await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.94, behavior: 'instant' }), trigger)
      await expect.poll(async () => Number(await scene.getAttribute('data-scene-progress'))).toBeGreaterThan(0.99)
      await expect(scene).toHaveAttribute('data-scene-pinned', 'true')
      await expect.poll(async () => scene.evaluate(node => Math.abs(node.getBoundingClientRect().top - window.innerHeight * 0.12))).toBeLessThan(4)

      // Stay in the pinned final hold, then release only after the scene reaches its end.
      await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.99, behavior: 'instant' }), trigger)
      await expect(scene).toHaveAttribute('data-scene-progress', '1.000')
      await expect(scene).toHaveAttribute('data-scene-pinned', 'true')
      await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance + 20, behavior: 'instant' }), trigger)
      await expect(scene).toHaveAttribute('data-scene-pinned', 'false')

      await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance * 0.4, behavior: 'instant' }), trigger)
      await expect.poll(async () => Number(await scene.getAttribute('data-scene-progress'))).toBeLessThan(0.7)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await expect.poll(async () => Number(await scene.getAttribute('data-scene-progress'))).toBeLessThan(0.1)
      await expectNoHorizontalOverflow(page)
    }
  }
})
