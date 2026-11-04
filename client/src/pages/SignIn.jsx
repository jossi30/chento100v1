import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash, FaUserTie, FaShieldAlt } from 'react-icons/fa';

export default function SignIn() {
  const { t } = useLanguage();
  const { signIn, signInWithGoogle, loginDemo } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: true });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const from = location.state?.from?.pathname || '';

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.id]: value,
    });
  };

  const handleRouteRedirect = (role, customTarget = '') => {
    if (customTarget && customTarget !== '/' && customTarget !== '/sign-in') {
      navigate(customTarget, { replace: true });
      return;
    }
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (role === 'host') {
      navigate('/partner', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  // 1-Click Google Sign In (Firebase OAuth popup + backend session sync)
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      dispatch(signInStart());
      const user = await signInWithGoogle();
      const userPayload = {
        _id: user.uid,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        isAdmin: Boolean(user.isAdmin),
        role: user.role || 'user',
        emailVerified: user.emailVerified,
      };
      dispatch(signInSuccess(userPayload));
      handleRouteRedirect(user.role, from);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign in failed. Please try again or use email sign in.');
      }
      dispatch(signInFailure(err.message));
    } finally {
      setGoogleLoading(false);
    }
  };

  // 1-Click Demo Accounts for testing Customer, Partner Host, or Admin
  const handleQuickDemo = async (role) => {
    try {
      setLoading(true);
      setError(null);
      dispatch(signInStart());
      const user = await loginDemo(role);
      const userPayload = {
        _id: user.uid,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        isAdmin: Boolean(user.isAdmin),
        role: user.role || 'user',
        emailVerified: user.emailVerified,
      };
      dispatch(signInSuccess(userPayload));
      handleRouteRedirect(user.role || role, from);
    } catch (err) {
      setError(err.message || 'Demo sign in failed.');
      dispatch(signInFailure(err.message));
    } finally {
      setLoading(false);
    }
  };

  // Standard Email & Password Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      dispatch(signInStart());

      const user = await signIn(formData.email.trim(), formData.password);

      const userPayload = {
        _id: user.uid,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        avatar: user.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        isAdmin: Boolean(user.isAdmin),
        role: user.role || 'user',
        emailVerified: user.emailVerified,
      };

      dispatch(signInSuccess(userPayload));
      handleRouteRedirect(user.role, from);
    } catch (err) {
      let msg = err.message || 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please reset your password or try again later.';
      }
      setError(msg);
      dispatch(signInFailure(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50'>
      <div className='w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-neutral-200/90 shadow-xl'>
        {/* Header */}
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-white text-xl font-bold mb-3 shadow-sm'>
            C
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight'>
            {t('signin.title') || 'Welcome Back'}
          </h1>
          <p className='text-xs sm:text-sm text-neutral-500 mt-1.5'>
            Sign in to access your bookings, vehicle rentals, and partner dashboard
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className='mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold leading-relaxed'>
            {error}
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <button
          type='button'
          disabled={googleLoading || loading}
          onClick={handleGoogleSignIn}
          className='w-full py-3 px-4 bg-white hover:bg-neutral-50 text-neutral-800 font-semibold border border-neutral-300 rounded-2xl text-sm transition flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-60 mb-5'
        >
          {/* Official Google G Logo SVG */}
          <svg className='w-4 h-4' viewBox='0 0 24 24'>
            <path
              fill='#4285F4'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            />
            <path
              fill='#34A853'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            />
            <path
              fill='#FBBC05'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
            />
            <path
              fill='#EA4335'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
            />
          </svg>
          <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
        </button>

        {/* Or Divider */}
        <div className='relative flex items-center justify-center mb-5'>
          <div className='border-t border-neutral-200 w-full' />
          <span className='bg-white px-3 text-xs text-neutral-400 font-medium uppercase tracking-wider shrink-0'>
            or with email
          </span>
          <div className='border-t border-neutral-200 w-full' />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-bold text-neutral-700 mb-1.5'>
              Email Address
            </label>
            <div className='relative'>
              <FaEnvelope className='absolute left-3.5 top-3.5 text-neutral-400 text-xs' />
              <input
                type='email'
                required
                id='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='you@example.com'
                className='w-full pl-9 pr-3.5 py-2.5 text-sm bg-neutral-50/70 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition'
              />
            </div>
          </div>

          <div>
            <div className='flex justify-between items-center mb-1.5'>
              <label className='block text-xs font-bold text-neutral-700'>Password</label>
              <Link to='/forgot-password' className='text-xs text-neutral-600 hover:text-black font-semibold'>
                Forgot password?
              </Link>
            </div>
            <div className='relative'>
              <FaLock className='absolute left-3.5 top-3.5 text-neutral-400 text-xs' />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                id='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='••••••••'
                className='w-full pl-9 pr-10 py-2.5 text-sm bg-neutral-50/70 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer'
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className='flex items-center justify-between text-xs pt-1'>
            <label className='flex items-center gap-2 cursor-pointer text-neutral-600'>
              <input
                type='checkbox'
                id='rememberMe'
                checked={formData.rememberMe}
                onChange={handleChange}
                className='rounded border-neutral-300 text-black focus:ring-black'
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type='submit'
            disabled={loading || googleLoading}
            className='w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-2xl text-sm transition shadow-sm disabled:opacity-50 cursor-pointer'
          >
            {loading ? 'Signing in...' : t('signin.submitButton') || 'Sign In'}
          </button>
        </form>

        {/* 1-Click Role Accounts Switcher */}
        <div className='mt-6 pt-5 border-t border-neutral-100 space-y-3'>
          <p className='text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center'>
            Quick 1-Click Demo Testing
          </p>
          <div className='grid grid-cols-3 gap-2'>
            <button
              type='button'
              disabled={loading}
              onClick={() => handleQuickDemo('guest')}
              className='py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50'
            >
              <span className='text-sm'>👤</span>
              <span className='text-[11px] truncate'>Traveler</span>
            </button>

            <button
              type='button'
              disabled={loading}
              onClick={() => handleQuickDemo('host')}
              className='py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50'
            >
              <span className='text-sm'>🏡</span>
              <span className='text-[11px] truncate'>Partner Host</span>
            </button>

            <button
              type='button'
              disabled={loading}
              onClick={() => handleQuickDemo('admin')}
              className='py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50'
            >
              <span className='text-sm'>🛡️</span>
              <span className='text-[11px] truncate'>Admin</span>
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className='mt-6 text-center text-xs text-neutral-600'>
          {t('signin.noAccount') || "Don't have an account?"}{' '}
          <Link to='/sign-up' className='text-black hover:underline font-bold'>
            {t('signin.signUpLink') || 'Sign up now'}
          </Link>
        </div>
      </div>
    </div>
  );
}
