import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wholesale AI - Negotiation Copilot',
  description: 'Real-time AI negotiation copilot for real estate wholesalers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}