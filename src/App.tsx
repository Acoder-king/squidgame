import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './hooks/ThemeContext';
import { AudioProvider } from './hooks/AudioContext';
import BootIntro from './components/BootIntro';
import CursorGlow from './components/CursorGlow';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center pt-24 text-dim">Loading…</div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  const [booted, setBooted] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('in26-booted') === '1';
    } catch {
      return false;
    }
  });

  const finishBoot = () => {
    try { sessionStorage.setItem('in26-booted', '1'); } catch { /* noop */ }
    setBooted(true);
  };

  return (
    <ThemeProvider>
      <AudioProvider>
        <BrowserRouter>
          <ScrollToTop />
          <CursorGlow />
          <AnimatePresence>{!booted && <BootIntro key="boot" onDone={finishBoot} />}</AnimatePresence>
          <Navbar />
          <main id="main">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home booted={booted} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/rules" element={<RulesPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/receipt" element={<ReceiptPage />} />
                <Route path="/api/receipt" element={<ReceiptPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </BrowserRouter>
      </AudioProvider>
    </ThemeProvider>
  );
}

