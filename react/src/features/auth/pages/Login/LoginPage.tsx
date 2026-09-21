import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { faUser, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useLocation } from 'react-router-dom';

import logo from '@/shared/assets/images/logo.png';
import sliderImage from '@/shared/assets/images/Slider.png';
import { Button, Input } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import styles from './Login.module.css';

export const LOGIN_STEPS = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT: 'forgot',
  VERIFY_NOTICE: 'verify_notice',
  USERNAME: 'username',
} as const;

export type LoginStep = (typeof LOGIN_STEPS)[keyof typeof LOGIN_STEPS];

const DEBUG_PASSWORD = '123!@#qweQ';

export interface LoginPageProps {
  initialStep?: LoginStep;
}

const LoginPage: React.FC<LoginPageProps> = ({ initialStep = LOGIN_STEPS.LOGIN }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    username: '',
  });

  const [activeStep, setActiveStep] = useState<LoginStep>(initialStep);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    if (location.pathname === '/signup') {
      setActiveStep(LOGIN_STEPS.SIGNUP);
    } else if (location.pathname === '/forgot-password' || location.pathname === '/forgetpassword') {
      setActiveStep(LOGIN_STEPS.FORGOT);
    } else if (location.pathname === '/login') {
      setActiveStep(LOGIN_STEPS.LOGIN);
    }
  }, [location.pathname]);

  const switchStep = (step: LoginStep) => {
    setIsAnimating(true);
    setTimeout(() => {
      setActiveStep(step);
      setIsAnimating(false);
    }, 200);
  };

  const handleChange =
    (field: keyof typeof formValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 1. Handle Login Submit
  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.email || !formValues.password) {
      toast.error('Please enter both email and password.');
      return;
    }

    if (!validateEmail(formValues.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (formValues.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formValues.email,
          password: formValues.password,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to login with those credentials.');
      }

      if (payload?.state === 'success' && payload?.step_2) {
        switchStep(LOGIN_STEPS.USERNAME);
        toast.success('Please choose a username to finish onboarding.');
        return;
      }

      await refreshUser();
      navigate('/chats', { replace: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong while signing in.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Signup Submit
  const handleSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = formValues.username.trim();
    const email = formValues.email.trim();
    const password = formValues.password;

    if (!username || !email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (username.length < 5 || username.length > 24) {
      toast.error('Username must be 5–24 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      toast.error('Password must contain uppercase, lowercase, digit, and special character.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to sign up right now.');
      }

      toast.success('Account created! Please check your email to verify.');
      switchStep(LOGIN_STEPS.VERIFY_NOTICE);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Forgot Password Submit
  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = formValues.email.trim();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to process password reset.');
      }

      toast.success('If that email exists in our system, a reset link has been dispatched!');
      switchStep(LOGIN_STEPS.LOGIN);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Resend Verification Email
  const handleResendVerification = async () => {
    const email = formValues.email.trim();
    if (!email) {
      toast.error('Please specify an email address to resend to.');
      return;
    }

    if (isResending) return;
    setIsResending(true);

    try {
      const response = await fetch('/api/v1/auth/verify-email/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to resend verification email.');
      }

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  // 5. Handle Debug Login
  const handleDebugLogin = async (email: string) => {
    setFormValues((prev) => ({
      ...prev,
      email,
      password: DEBUG_PASSWORD,
    }));

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: DEBUG_PASSWORD }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to login with those credentials.');
      }

      await refreshUser();
      navigate('/chats', { replace: true });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Debug login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Handle Legacy Username Step 2 Submit
  const handleUsernameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;
    const username = formValues.username.trim();

    if (!username) {
      toast.error('Please enter a username.');
      return;
    }

    if (username.length > 24) {
      toast.error('Username can be at most 24 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only include letters, numbers, and underscores.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userInfoResponse = await fetch('/api/v1/user/info', {
        method: 'GET',
        credentials: 'include',
      });

      if (!userInfoResponse.ok) {
        const payload = await userInfoResponse.json().catch(() => ({}));
        throw new Error(payload?.message || 'Unable to load your profile.');
      }

      const payload = await userInfoResponse.json();
      const userInfo = payload?.userInfo ?? {};

      const updateResponse = await fetch('/api/v1/user/info', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...userInfo, username }),
      });

      if (!updateResponse.ok) {
        const updatePayload = await updateResponse.json().catch(() => ({}));
        throw new Error(updatePayload?.message || 'Unable to update username.');
      }

      await refreshUser();
      navigate('/chats', { replace: true });
      toast.success('You are all set!');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to complete onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.popUp} ${isAnimating ? styles.formFade : ''}`}>
        <div className={styles.slider}>
          <img src={sliderImage} alt="Slider" className={styles.sliderImage} />
        </div>
        <div className={styles.form}>
          <img src={logo} alt="Logo" className={styles.logo} />

          {/* VIEW 1: LOGIN */}
          {activeStep === LOGIN_STEPS.LOGIN && (
            <>
              <h2 className={styles.Titr}>Login to your account</h2>
              <h4 className={styles.Discription}>Enter your email address and password to login</h4>

              <form
                className={styles['form-inputs']}
                onSubmit={handleLoginSubmit}
                autoComplete="on"
              >
                <Input
                  type="email"
                  name="email"
                  id="login-email"
                  placeholder="Email"
                  icon={faEnvelope}
                  value={formValues.email}
                  onChange={handleChange('email')}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  size="md"
                  fullWidth
                />

                <Input
                  type="password"
                  name="password"
                  id="login-password"
                  placeholder="Password"
                  icon={faLock}
                  value={formValues.password}
                  onChange={handleChange('password')}
                  autoComplete="current-password"
                  size="md"
                  fullWidth
                />

                <div className={styles.linkRow}>
                  <button
                    type="button"
                    className={styles.formLink}
                    onClick={() => switchStep(LOGIN_STEPS.FORGOT)}
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait...' : 'Login'}
                </Button>

                <p className={styles.toggleAuth}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => switchStep(LOGIN_STEPS.SIGNUP)}
                  >
                    Sign up
                  </button>
                </p>

                <div className={styles.debugLogin}>
                  <p className={styles.debugLabel}>Debug logins</p>
                  <div className={styles.debugButtons}>
                    <Button
                      type="button"
                      size="sm"
                      fullWidth
                      className={styles.debugButton}
                      onClick={() => handleDebugLogin('aminsec@gmail.com')}
                    >
                      Login with aminsec
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      fullWidth
                      className={styles.debugButton}
                      onClick={() => handleDebugLogin('snow@gmail.com')}
                    >
                      Login with snow
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      fullWidth
                      className={styles.debugButton}
                      onClick={() => handleDebugLogin('blackhole@gmail.com')}
                    >
                      Login with blackhole
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* VIEW 2: SIGNUP */}
          {activeStep === LOGIN_STEPS.SIGNUP && (
            <>
              <h2 className={styles.Titr}>Create an account</h2>
              <h4 className={styles.Discription}>Join SnappTalk and start chatting with friends</h4>

              <form
                className={styles['form-inputs']}
                onSubmit={handleSignupSubmit}
                autoComplete="on"
              >
                <Input
                  type="text"
                  name="username"
                  id="signup-username"
                  placeholder="Username (5-24 chars, a-z, 0-9, _)"
                  icon={faUser}
                  value={formValues.username}
                  onChange={handleChange('username')}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  size="md"
                  fullWidth
                />

                <Input
                  type="email"
                  name="email"
                  id="signup-email"
                  placeholder="Email"
                  icon={faEnvelope}
                  value={formValues.email}
                  onChange={handleChange('email')}
                  autoComplete="email"
                  size="md"
                  fullWidth
                />

                <Input
                  type="password"
                  name="password"
                  id="signup-password"
                  placeholder="Password (uppercase, lowercase, number, symbol)"
                  icon={faLock}
                  value={formValues.password}
                  onChange={handleChange('password')}
                  autoComplete="new-password"
                  size="md"
                  fullWidth
                />

                <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>

                <p className={styles.toggleAuth}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => switchStep(LOGIN_STEPS.LOGIN)}
                  >
                    Log in
                  </button>
                </p>
              </form>
            </>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {activeStep === LOGIN_STEPS.FORGOT && (
            <>
              <h2 className={styles.Titr}>Reset Password</h2>
              <h4 className={styles.Discription}>
                Enter your email address and we will send you a reset link
              </h4>

              <form className={styles['form-inputs']} onSubmit={handleForgotSubmit}>
                <Input
                  type="email"
                  name="email"
                  id="forgot-email"
                  placeholder="Enter your email"
                  icon={faEnvelope}
                  value={formValues.email}
                  onChange={handleChange('email')}
                  autoComplete="email"
                  size="md"
                  fullWidth
                />

                <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
                </Button>

                <div className={styles.backRow}>
                  <button
                    type="button"
                    className={styles.backLink}
                    onClick={() => switchStep(LOGIN_STEPS.LOGIN)}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Back to login</span>
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW 4: VERIFY NOTICE & RESEND */}
          {activeStep === LOGIN_STEPS.VERIFY_NOTICE && (
            <>
              <h2 className={styles.Titr}>Check your email</h2>
              <h4 className={styles.Discription}>
                We sent a verification link to <strong>{formValues.email}</strong>. Please check
                your inbox to activate your account.
              </h4>

              <div className={styles['form-inputs']}>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  disabled={isResending}
                  onClick={handleResendVerification}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>

                <Button
                  type="button"
                  size="md"
                  fullWidth
                  onClick={() => switchStep(LOGIN_STEPS.LOGIN)}
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}

          {/* VIEW 5: USERNAME (LEGACY ONBOARDING STEP) */}
          {activeStep === LOGIN_STEPS.USERNAME && (
            <>
              <h2 className={styles.Titr}>Enter Username</h2>
              <h4 className={styles.Discription}>Please enter your username to complete login</h4>

              <form className={styles['form-inputs']} onSubmit={handleUsernameSubmit}>
                <Input
                  value={formValues.username}
                  onChange={handleChange('username')}
                  type="text"
                  name="username"
                  id="onboard-username"
                  placeholder="Username"
                  icon={faUser}
                  autoFocus
                  size="md"
                  fullWidth
                  className="slide-in"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="slide-in"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

