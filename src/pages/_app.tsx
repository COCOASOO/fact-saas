import type { AppProps } from 'next/app';
import { AuthProvider } from '@/app/contexts/authContext';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from 'sonner';
import '@/app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Component {...pageProps} />
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
} 