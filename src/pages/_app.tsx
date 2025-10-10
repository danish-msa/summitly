import type { AppProps } from 'next/app';
import GoogleMapsProvider from '../components/Maps/GoogleMapsProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleMapsProvider>
      <Component {...pageProps} />
    </GoogleMapsProvider>
  );
}