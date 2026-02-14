import './globals.css';

export const metadata = {
  title: "Rollin' Tanks",
  description: 'Draw your tanks. Roll the dice. Destroy your friends.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
