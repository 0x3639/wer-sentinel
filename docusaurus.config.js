// @ts-check
// Docusaurus configuration. See https://docusaurus.io/docs/api/docusaurus-config
// NOTE: update `url`, `baseUrl`, `organizationName`, and `projectName` to match the
// GitHub repository you deploy to (these defaults assume a project site at
// https://0x3639.github.io/wer-sentinel/).

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Sentinels in Syrius',
  tagline: 'Running a Sentinel service node from inside the Syrius wallet',
  favicon: 'img/favicon.svg',

  url: 'https://0x3639.github.io',
  baseUrl: '/wer-sentinel/',
  organizationName: '0x3639',
  projectName: 'wer-sentinel',

  // Don't hard-fail the build on a broken cross-link while the docs evolve.
  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',

  // Process `.md` as CommonMark (so prose with `<` and `{` doesn't break MDX parsing);
  // `.mdx` files still get full MDX.
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'docs',
          routeBasePath: '/', // docs-only mode: docs are served at the site root
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: [
    [
      // Offline/local full-text search (no Algolia account needed).
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/',
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Sentinels in Syrius',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/zenon-network/syrius',
            label: 'Syrius source',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Overview', to: '/'},
              {label: 'Investigation', to: '/evidence/investigation'},
              {label: 'Specification', to: '/specification/sentinel-service-layer'},
              {label: 'Roadmap', to: '/implementation/roadmap'},
            ],
          },
          {
            title: 'Source',
            items: [
              {label: 'Syrius', href: 'https://github.com/zenon-network/syrius'},
              {label: 'zenon-developer-commons', href: 'https://github.com/TminusZ/zenon-developer-commons'},
            ],
          },
        ],
        copyright: 'Sentinels in Syrius — community documentation. Built with Docusaurus.',
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['dart', 'json', 'bash'],
      },
    }),
};

export default config;
