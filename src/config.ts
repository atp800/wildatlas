// Site-wide configuration.
//
// This file is imported at build time, so changes take effect on the next
// dev-server reload or production build. Add new settings as new fields or
// new sections on the `siteConfig` object below, then import them where needed.

export const siteConfig = {
  store: {
    // When false, products show "Currently Unavailable" instead of an
    // add-to-cart button, and checkout is blocked with the message below.
    isActive: false,
    unavailableLabel: 'Currently Unavailable',
    inactiveCheckoutMessage:
      'Sorry, the store is not currently live. Please check back soon!',
  },

  home: {
    // When false, the About section is removed from the homepage.
    showAbout: false,
  },

  conservation: {
    // Controls both /conservation and its menu link. When false, the page
    // is not generated or included in the sitemap. Rebuild to apply.
    isEnabled: true,
  },

  // Add future site-wide settings here, for example:
  // social: { instagram: '...', tiktok: '...' },
};
