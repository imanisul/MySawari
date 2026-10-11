import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// expo-router's default web document sets no background color at all, so the browser's own white
// shows through for every frame before React paints anything — including the whole font/auth-loading
// window where _layout.tsx intentionally renders null. That gap is the "white blink" on load.
// These colors mirror constants/colors.ts background — kept as plain hex here since this file renders
// before any JS (and therefore the in-app dark-mode toggle) exists; the OS color-scheme is the best
// signal available this early.
const LIGHT_BG = '#F5F7FA';
const DARK_BG = '#0A1220';

/**
 * The root HTML document for the web build (Expo Router convention). Only affects `expo start --web`
 * / web export — native app screens are unaffected by this file.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { background-color: ${LIGHT_BG}; }
              @media (prefers-color-scheme: dark) {
                html, body, #root { background-color: ${DARK_BG}; }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
