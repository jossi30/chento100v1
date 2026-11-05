import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import CreateListing from './pages/CreateListing';
import UpdateListing from './pages/UpdateListing';
import Listing from './pages/Listing';
import Search from './pages/Search';
import NotFound from './pages/NotFound';
import Partner from './pages/Partner';
import { LanguageProvider } from './context/LanguageContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <main key={location.pathname} className='animate-fadeInUp min-h-[calc(100vh-76px)]'>
      <Routes location={location}>
        <Route path='/' element={<Home />} />
        
        {/* Redirect all legacy sign-in & dashboard routes exclusively to Partner with us */}
        <Route path='/sign-in' element={<Navigate to='/partner' replace />} />
        <Route path='/sign-up' element={<Navigate to='/partner' replace />} />
        <Route path='/forgot-password' element={<Navigate to='/partner' replace />} />
        <Route path='/verify-email' element={<Navigate to='/partner' replace />} />
        <Route path='/profile' element={<Navigate to='/partner' replace />} />
        <Route path='/dashboard' element={<Navigate to='/partner' replace />} />
        <Route path='/admin-dashboard' element={<Navigate to='/partner' replace />} />

        {/* Public marketplace & information */}
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/search' element={<Search />} />
        <Route path='/listings' element={<Search />} />
        <Route path='/listing/:listingId' element={<Listing />} />

        {/* Sole Partner with us portal & dashboard */}
        <Route path='/partner' element={<Partner />} />
        <Route path='/host' element={<Partner />} />

        {/* Host listing authoring & editing */}
        <Route element={<PrivateRoute />}>
          <Route path='/create-listing' element={<CreateListing />} />
          <Route
            path='/update-listing/:listingId'
            element={<UpdateListing />}
          />
        </Route>

        <Route path='*' element={<NotFound />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Header />
        <AppRoutes />
        <Footer />
      </BrowserRouter>
    </LanguageProvider>
  );
}
