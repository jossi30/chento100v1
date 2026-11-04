import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import CreateListing from './pages/CreateListing';
import UpdateListing from './pages/UpdateListing';
import Listing from './pages/Listing';
import Search from './pages/Search';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import Partner from './pages/Partner';
import AdminRoute from './components/AdminRoute';
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
        <Route path='/sign-in' element={<SignIn />} />
        <Route path='/sign-up' element={<SignUp />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/verify-email' element={<VerifyEmail />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/search' element={<Search />} />
        <Route path='/listings' element={<Search />} />
        <Route path='/listing/:listingId' element={<Listing />} />
        <Route path='/partner' element={<Partner />} />
        <Route path='/host' element={<Partner />} />

        <Route element={<PrivateRoute />}>
          <Route path='/profile' element={<Profile />} />
          <Route path='/dashboard' element={<Profile />} />
          <Route path='/create-listing' element={<CreateListing />} />
          <Route
            path='/update-listing/:listingId'
            element={<UpdateListing />}
          />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path='/admin-dashboard' element={<AdminDashboard />} />
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

