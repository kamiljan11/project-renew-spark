import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { LanguageProvider } from "@/i18n/LanguageContext";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MAS Parts Iceland — Order spare parts to Iceland fast" },
      {
        name: "description",
        content:
          "Found a car part online? Send us the link — we buy, ship and deliver to Iceland with a proper Icelandic VAT invoice.",
      },
      { property: "og:title", content: "MAS Parts Iceland — Order spare parts to Iceland fast" },
      {
        property: "og:description",
        content:
          "Found a car part online? Send us the link — we buy, ship and deliver to Iceland with a proper Icelandic VAT invoice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "MAS Parts Iceland — Order spare parts to Iceland fast" },
      {
        name: "twitter:description",
        content:
          "Found a car part online? Send us the link — we buy, ship and deliver to Iceland with a proper Icelandic VAT invoice.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ae6c917f-f252-450c-8256-359e870bcc80/id-preview-bc4fa455--d4dd7ba6-76a9-4af3-8748-b3cea08c0c76.lovable.app-1777826166259.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ae6c917f-f252-450c-8256-359e870bcc80/id-preview-bc4fa455--d4dd7ba6-76a9-4af3-8748-b3cea08c0c76.lovable.app-1777826166259.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,700;0,800;0,900;1,700;1,800;1,900&family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: () => (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-navy">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found.</p>
        <a
          href="/"
          className="inline-flex mt-6 px-4 py-2 rounded-md bg-mas-orange text-white font-medium"
        >
          Go home
        </a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
