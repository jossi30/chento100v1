import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function SignUp() {
  const { t } = useLanguage();
  const { signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      dispatch(
        signInSuccess({
          _id: user.uid,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
          avatar: user.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          isAdmin: user.isAdmin,
          role: user.role,
          emailVerified: user.emailVerified,
        })
      );
      navigate('/dashboard');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google registration failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError('Please provide your full name or company name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service to create an account.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await signUp(
        formData.email.trim(),
        formData.password,
        formData.username.trim(),
        formData.phone.trim()
      );

      dispatch(
        signInSuccess({
          _id: user.uid,
          uid: user.uid,
          email: user.email,
          displayName: formData.username.trim(),
          avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          isAdmin: user.isAdmin,
          role: user.role,
          emailVerified: user.emailVerified,
        })
      );

      navigate('/verify-email');
    } catch (err) {
      let msg = err.message || 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password is too weak. Please choose a stronger password (minimum 6 characters).';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50'>
      <div className='w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-neutral-200/90 shadow-xl'>
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-white text-xl font-bold mb-3 shadow-sm'>
            C
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight'>
            {t('signup.title') || 'Create an Account'}
          </h1>
          <p className='text-xs sm:text-sm text-neutral-500 mt-1.5'>
            Join the verified marketplace for guest houses &amp; car rentals
          </p>
        </div>

        {error && (
          <div className='mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold leading-relaxed'>
            {error}
          </div>
        )}

        {/* 1-Click Google Sign-Up */}
        <button
          type='button'
          disabled={googleLoading || loading}
          onClick={handleGoogleSignUp}
          className='w-full py-3 px-4 bg-white hover:bg-neutral-50 text-neutral-800 font-semibold border border-neutral-300 rounded-2xl text-sm transition flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-60 mb-5'
        >
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
          <span>{googleLoading ? 'Connecting Google...' : 'Sign up with Google'}</span>
        </button>

        <div className='relative flex items-center justify-center mb-5'>
          <div className='border-t border-neutral-200 w-full' />
          <span className='bg-white px-3 text-xs text-neutral-400 font-medium uppercase tracking-wider shrink-0'>
            or register with email
          </span>
          <div className='border-t border-neutral-200 w-full' />
        </div>

        <form onSubmit={handleSubmit} className='space-y-3.5'>
          <div>
            <label className='block text-xs font-bold text-neutral-700 mb-1'>Full Name / Business Name</label>
            <div className='relative'>
              <FaUser className='absolute left-3.5 top-3.5 text-neutral-400 text-xs' />
              <input
                type='text'
                required
                id='username'
                value={formData.username}
                onChange={handleChange}
                placeholder='Jane Doe'
                className='w-full pl-9 pr-3.5 py-2.5 text-sm bg-neutral-50/70 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition'
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-bold text-neutral-700 mb-1'>Email Address</label>
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
            <label className='block text-xs font-bold text-neutral-700 mb-1'>Contact Phone / WhatsApp</label>
            <div className='relative'>
              <FaPhone className='absolute left-3.5 top-3.5 text-neutral-400 text-xs' />
              <input
                type='tel'
                id='phone'
                value={formData.phone}
                onChange={handleChange}
                placeholder='+1 (555) 019-2834'
                className='w-full pl-9 pr-3.5 py-2.5 text-sm bg-neutral-50/70 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-bold text-neutral-700 mb-1'>Password</label>
              <div className='relative'>
                <FaLock className='absolute left-3.5 top-3.5 text-neutral-400 text-xs' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  id='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='Min 6 chars'
                  className='w-full pl-9 pr-8 py-2.5 text-sm bg-neutral-50/70 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-bold text-neutral-700 mb-1'>Confirm Password</label>
              <div className='relative'>
                <FaLock className='absolute left-3.5 top-3.5 text-neutral-400 text-xs' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  id='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder='Repeat password'
                  className='w-full pl-9 pr-8 py-2.5 text-sm bg-neutral-50/70 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-black focus:bg-white transition'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-2.5 top-3.5 text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer'
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <div className='pt-1'>
            <label className='flex items-start gap-2 cursor-pointer text-xs text-neutral-600'>
              <input
                type='checkbox'
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className='mt-0.5 rounded border-neutral-300 text-black focus:ring-black cursor-pointer'
              />
              <span>
                I agree to the{' '}
                <Link to='/terms' className='text-black underline font-semibold' target='_blank'>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to='/privacy' className='text-black underline font-semibold' target='_blank'>
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <button
            type='submit'
            disabled={loading || googleLoading}
            className='w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-2xl text-sm transition shadow-sm disabled:opacity-50 cursor-pointer'
          >
            {loading ? 'Creating account...' : t('signup.submitButton') || 'Sign Up'}
          </button>
        </form>

        <div className='mt-5 text-center text-xs text-neutral-600'>
          {t('signup.haveAccount') || 'Already have an account?'}{' '}
          <Link to='/sign-in' className='text-black hover:underline font-bold'>
            {t('signup.signInLink') || 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
