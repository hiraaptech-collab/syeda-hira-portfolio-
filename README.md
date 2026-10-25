# Syeda Hira — Full Stack Developer Portfolio

A six-page React and Vite portfolio with a warm greige and ivory foundation, royal navy contrast, editorial typography, GSAP reveals, reduced-motion support, and lazy-loaded procedural Three.js scenes across all pages.

## Run locally

Use Node.js 20.19+ or 22.12+, then run:

```sh
npm install
npm run dev
```

Create a production bundle with `npm run build`, inspect it locally with `npm run preview`, and run the Playwright checks with `npm run test:e2e`.

## Pages

| Route | Page |
| --- | --- |
| `/` | Home and introduction |
| `/about` | About Syeda Hira |
| `/projects` | Four selected projects and their supplied screenshots |
| `/skills` | Skills by category |
| `/education` | Education, experience, and certification details |
| `/contact` | Hire Me and working contact links |

The Home page links to the projects but does not repeat the project gallery. Email, phone, GitHub, Instagram, and Facebook details are in `src/data/profile.js`.

## Project screenshots

The Projects page uses the screenshots supplied for Fan Hub, Architecture 3D, Lumière, and FitFusion from `public/projects/`. Descriptions, project URLs, features, and screenshot paths are maintained in `src/data/projects.js`.

## Procedural scenes

The Home hero uses a fully procedural 3D desk workspace. Its desk, laptop, books, keyboard, mouse, coffee mug, and lamp use generated geometry and PBR materials; a canvas texture types code onto the screen. The camera begins front-on, then performs a slow orbit. The assembly starts with the loader fade, completes automatically in about 9.5 seconds, and remains in its finished idle state.

The Projects scene uses the four supplied project screenshots as the surfaces of floating 3D screens. About has layered story panels, Skills has a connected code and technology network, Education has a dimensional learning timeline, and Contact has a procedural smartphone call sequence. These route scenes pause while offscreen, scrub forward and backward with GSAP ScrollTrigger, and respect reduced-motion preferences. Page headings use staggered GSAP perspective entrances.

All scene geometry is generated in React Three Fiber. The four authentic project screenshots remain the only image textures used in the 3D project gallery.

## Technology and integrations

- React 19, React DOM, and React Router provide the UI and six client-side routes.
- Vite 7 and the React Vite plugin build and serve the static site.
- Three.js, React Three Fiber, and Drei render the procedural 3D scenes. GSAP and ScrollTrigger coordinate UI motion and reversible scroll scenes.
- Lucide React supplies interface icons; DM Sans and Cormorant Garamond are bundled locally through Fontsource.
- Playwright runs browser-based regression checks.
- This portfolio has no backend service, database connection, or API integration. Contact actions use `mailto:` and `tel:` links plus the verified social profiles in `src/data/profile.js`.

## Production hosting

The production output is the static `dist/` directory. Both hosting configs include a single-page-app fallback so direct visits and refreshes on the six routes return `index.html`.

- **Netlify:** connect the repository, set build command to `npm run build`, and publish directory to `dist`. `public/_redirects` supplies the SPA fallback.
- **Vercel:** import the repository with the Vite preset and keep the build command `npm run build` and output directory `dist`. `vercel.json` rewrites extensionless routes to `index.html`.

No secrets or backend environment variables are required. Set the optional `VITE_SITE_URL` for production SEO output. Review the four external project destinations and public contact links in `src/data/projects.js` and `src/data/profile.js` before hosting. Deployment must be initiated separately by the site owner; this repository has not been published by these changes.

## SEO and Bluehost deployment

The six routes have route-specific titles and descriptions, Open Graph/Twitter metadata, a 1200 × 630 people-free PNG preview based on the existing portfolio artwork, and Person JSON-LD using the verified name, job title, location, email, and social links. The build creates lightweight static route HTML shells with page headings, descriptions, and navigation before JavaScript starts; React then renders each interactive page and procedural 3D scene as usual.

Set `VITE_SITE_URL` to the final origin before building so canonical URLs, absolute social-image URLs, the `robots.txt` sitemap reference, and a six-route `sitemap.xml` use the correct domain. In PowerShell: `$env:VITE_SITE_URL = 'https://your-domain.example'; npm run build`. Without this value, canonical URLs and `sitemap.xml` are intentionally omitted; set it before creating the deployment build.

For standard Bluehost Apache hosting, upload the **contents** of `dist/` into `public_html/`, including the hidden `.htaccess` file. Keep the site at the domain root unless asset paths are updated for a subdirectory. The Apache fallback preserves existing files while resolving React routes on direct visits and refreshes. No backend or database is required.

## Main files

- `src/App.jsx` contains routing, loading coordination, and the shared layout.
- `src/pages/Home.jsx` contains the homepage sections.
- `src/pages/Foundations.jsx` contains About, Projects, Skills, Education, and Contact.
- `src/components/` contains shared navigation, motion, project cards, loader, cursor, and 3D scene components.
- `src/styles/theme.css` and `src/styles/global.css` define the theme and layouts.
- `src/data/` contains editable profile, project, skill, education, and character content.
- `public/` contains the four supplied project screenshots, the existing favicon, and the people-free atmospheric hero artwork.

Netlify's SPA fallback is provided in `public/_redirects`. No site has been published by this project change.
