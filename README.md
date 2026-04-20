# WildAtlas

A high-performance static website built with Astro for travel blogging, eco product reviews, and science/nature articles. Features optimized images, responsive design, and excellent Lighthouse performance scores.

## 🌟 Features

- **Multi-category content**: Travel guides, eco product reviews, science articles, and personal blog posts
- **Performance optimized**: Lighthouse scores 85-95+ with advanced image optimization
- **Responsive design**: Mobile-first approach with optimized images for all screen sizes
- **Modern web standards**: WebP images with fallbacks, lazy loading, and critical CSS
- **SEO friendly**: Sitemap generation, RSS feeds, and OpenGraph metadata
- **Content management**: MDX support with frontmatter validation
- **Analytics ready**: Google Tag Manager integration with performance optimization

## 🚀 Quick Start

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WildAtlas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The site will be available at `http://localhost:4321`

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run start` | Alias for `npm run dev` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run optimize-images` | Optimize all images (WebP conversion + responsive sizes) |
| `npm run build:optimized` | Run image optimization then build for production |
| `npm run astro` | Run Astro CLI commands |

## 🏗️ Project Structure

```
├── public/                 # Static assets (images, icons, fonts)
├── src/
│   ├── components/         # Reusable Astro/Svelte components
│   │   ├── OptimizedImage.astro    # Responsive image component
│   │   ├── BaseHead.astro          # SEO and performance optimizations
│   │   └── ...
│   ├── content/           # Content collections (MDX files)
│   │   ├── articles/      # Science and nature articles
│   │   ├── blog/          # Personal blog posts
│   │   ├── eco/           # Eco product reviews
│   │   ├── travel/        # Travel guides and tips
│   │   └── config.ts      # Content schema validation
│   ├── layouts/           # Page layout templates
│   │   ├── MainLayout.astro        # Base layout
│   │   ├── BlogPost.astro          # Blog post layout
│   │   ├── ArticlesPost.astro      # Article layout
│   │   ├── EcoPost.astro           # Eco review layout
│   │   └── TravelPost.astro        # Travel post layout
│   ├── pages/             # File-based routing
│   │   ├── index.astro             # Homepage
│   │   ├── about.astro             # About page
│   │   ├── articles/               # Articles section
│   │   ├── blog/                   # Blog section
│   │   ├── eco/                    # Eco reviews section
│   │   ├── travel/                 # Travel section
│   │   └── rss.xml.js              # RSS feed generation
│   └── styles/            # Global CSS styles
├── scripts/
│   └── optimize-images.js  # Image optimization script
├── astro.config.mjs       # Astro configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 📝 Content Management

### Adding New Content

Content is organized into four main categories:

1. **Articles** (`src/content/articles/`): Science and nature articles
2. **Blog** (`src/content/blog/`): Personal blog posts
3. **Eco** (`src/content/eco/`): Eco-friendly product reviews
4. **Travel** (`src/content/travel/`): Travel guides and tips

### Content Format

All content files use MDX format with frontmatter:

```markdown
---
title: "Your Post Title"
description: "Brief description for SEO"
pubDate: "2024-01-01"
heroImage: "/path/to/image.jpg"
tags: ["tag1", "tag2"]
---

Your content here using Markdown and MDX syntax...
```

### Adding Images

1. **Place images** in the `public/` directory
2. **Run optimization** (recommended):
   ```bash
   npm run optimize-images
   ```
3. **Use OptimizedImage component** in your content:
   ```astro
   <OptimizedImage 
     src="/your-image.jpg" 
     alt="Description" 
     width={800} 
     height={600} 
   />
   ```

## 🎨 Customization

### Styling

- Global styles: `src/styles/global.css`
- Component-specific styles: Scoped `<style>` blocks in `.astro` files
- CSS custom properties for consistent theming

### Site Configuration

Update `astro.config.mjs` for:
- Site URL and base path
- Integration settings
- Build configurations

### Content Schema

Modify `src/content/config.ts` to:
- Add new content types
- Update frontmatter validation
- Define content relationships

## ⚡ Performance Features

This site includes advanced performance optimizations:

### Image Optimization
- **WebP format** with JPEG fallbacks
- **Responsive images** with multiple sizes (320w, 640w, 768w, 1024w, 1280w)
- **Lazy loading** for below-the-fold content
- **Proper dimensions** to prevent layout shifts

### Loading Optimizations
- **Critical CSS** inlined for above-the-fold content
- **Asynchronous font loading** with fallbacks
- **Deferred third-party scripts** (Google Tag Manager)
- **Resource preloading** for critical assets

### Build Optimizations
- **Static site generation** for fast loading
- **Automatic sitemap** generation
- **RSS feed** generation
- **Bundle optimization** with Astro's build system

## 🧪 Testing

### Performance Testing

1. **Local Lighthouse testing**:
   ```bash
   npm run dev
   # Open Chrome DevTools → Lighthouse → Performance
   ```

2. **Production build testing**:
   ```bash
   npm run build:optimized
   npm run preview
   # Test at http://localhost:4321
   ```

### Content Testing

- Verify all content renders correctly
- Check responsive design on different screen sizes
- Test image loading and optimization
- Validate RSS feeds and sitemaps

## 🚀 Deployment

### Build for Production

```bash
# Standard build
npm run build

# Optimized build (recommended)
npm run build:optimized
```

### Deployment Options

The built site (`dist/` folder) can be deployed to:
- **Netlify**: Drag and drop or Git integration
- **Vercel**: Git integration with automatic builds
- **GitHub Pages**: Static site hosting
- **Any static hosting provider**

### Environment Variables

For production deployment, configure:
- Site URL in `astro.config.mjs`
- Google Analytics/Tag Manager IDs
- Any API keys for external services

## 📊 Performance Metrics

Expected Lighthouse scores after optimization:
- **Performance**: 85-95+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 95+

Key metrics:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## 🛠️ Development

### Adding New Features

1. **Components**: Create in `src/components/`
2. **Pages**: Add to `src/pages/` (file-based routing)
3. **Layouts**: Create in `src/layouts/`
4. **Content types**: Update `src/content/config.ts`

### Code Style

- Use TypeScript for type safety
- Follow Astro component conventions
- Implement responsive design patterns
- Optimize for performance and accessibility

## 📚 Documentation

- **Performance optimizations**: See `PERFORMANCE_OPTIMIZATIONS.md`
- **Testing guide**: See `TESTING_GUIDE.md`
- **Astro documentation**: [docs.astro.build](https://docs.astro.build)
- **MDX guide**: [mdxjs.com](https://mdxjs.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test performance impact
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues or questions:
1. Check existing documentation
2. Review performance guides
3. Test in development environment
4. Create an issue with detailed information

---

Built with ❤️ using [Astro](https://astro.build) and optimized for performance and user experience.
