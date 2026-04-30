import './globals.css';

const TITLE = "Rollin' Tanks";
const DESCRIPTION = 'Draw your tanks. Roll the dice. Destroy your friends. A 2-player real-time arcade tank game.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  // src/app/icon.svg is auto-picked up by Next.js as the favicon — no /public needed
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: TITLE,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
  themeColor: '#0f0f23',
};

export const viewport = {
  themeColor: '#0f0f23',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
