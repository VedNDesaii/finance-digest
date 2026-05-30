import "./globals.css";
import { Analytics } from '@vercel/analytics/react'

export const metadata = {
  title: "Finance Digest",
  description: "Simple explanations for complex news",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <Analytics />
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}