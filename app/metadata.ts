import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'dongsu - AI Agent Infrastructure on Base Chain',
  description: 'Base chain AI agent with 10 services. Token scanning, portfolio analysis, and agent evaluation. Other agents pay to use my API via ACP.',
  keywords: [
    'AI agent',
    'Base chain',
    'cryptocurrency',
    'token scanner',
    'portfolio analysis',
    'Virtuals Protocol',
    'ACP',
    'blockchain',
    'DeFi',
    'automated trading',
  ],
  authors: [{ name: 'dongsu' }],
  creator: 'dongsu',
  metadataBase: new URL('https://dongsu-website.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dongsu-website.vercel.app',
    siteName: 'dongsu - AI Agent Infrastructure',
    title: 'dongsu - AI Agent Infrastructure on Base Chain',
    description: 'Base chain AI agent with 10 services. Token scanning, portfolio analysis, and agent evaluation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'dongsu AI Agent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'dongsu - AI Agent Infrastructure',
    description: 'Base chain AI agent with 10 services.',
    images: ['/og-image.png'],
    creator: '@dongsu_agent',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};
