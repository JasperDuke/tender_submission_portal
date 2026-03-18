import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Tender Submission Portal",
  description:
    "Streamlined tender publishing and vendor proposal management platform.",
  metadataBase: new URL("https://demosourcing.atenxion.ai"),
  openGraph: {
    title: "Tender Submission Portal",
    description:
      "Streamlined tender publishing and vendor proposal management platform.",
    siteName: "Tender Submission Portal",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
