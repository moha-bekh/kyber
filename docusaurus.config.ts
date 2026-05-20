import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Kyber',
  tagline: 'Open source remote streaming — ultra-low latency, high quality, cross-platform',
  favicon: 'img/kyber-icon-gradient.svg',

  future: {
    v4: true,
  },

  url: 'https://kyber.example.com',
  baseUrl: '/',

  organizationName: 'kyber',
  projectName: 'kyber',

  onBrokenLinks: 'warn',

  markdown: {
    // .md files are parsed as plain CommonMark, .mdx as MDX. Avoids MDX choking on
    // GitHub-style autolinks like <https://…> and ASCII arrows like CPU <-> GPU.
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: true,
        docsRouteBasePath: 'docs',
        blogRouteBasePath: 'blog',
      },
    ],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: {
          routeBasePath: 'blog',
          showReadingTime: true,
          blogTitle: 'Kyber Blog',
          blogDescription: 'News and release notes from the Kyber team',
          blogSidebarTitle: 'Recent posts',
          // Many releases on one page would be noisy — show one full post per page.
          blogSidebarCount: 'ALL',
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Kyber Blog',
          },
          // Release notes are short — no need for "<!-- truncate -->" on every post.
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: 'Kyber',
        // Light theme: gradient logo isn't allowed on light backgrounds per the brand
        // book (it's reserved for Black 1). Use the solid black wordmark there.
        src: 'img/kyber-wordmark-black.svg',
        srcDark: 'img/kyber-wordmark-gradient.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        { to: '/blog/tags/releases', label: 'Releases', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/GettingStarted/' },
            { label: 'Architecture', to: '/docs/Architecture/' },
            { label: 'Developer Starter Kit', to: '/docs/DevStarterKit/' },
            { label: 'FAQ', to: '/docs/Help/FAQ' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Kyber. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
