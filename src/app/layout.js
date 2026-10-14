import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import './globals.css';

export const metadata = {
  title: 'Amaya Visitor Registration',
  description:
    'Register your interest in Amaya, Senior Living by Vera Vita — Medchal, Hyderabad — and receive the e-brochure.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
