import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { faUser, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import {
  faLock,
  faArrowLeft,
  faEye,
  faEyeSlash,
  faPaperPlane,
  faEnvelopeOpenText,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useLocation } from 'react-router-dom';

import LogoWhite from '@/shared/assets/images/logo-white.png';
import LogoBlack from '@/shared/assets/images/logo-black.png';
import { Input } from '@/shared/components';
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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (location.pathname === '/signup') {
      setSlideDirection('right');
      setActiveStep(LOGIN_STEPS.SIGNUP);
    } else if (
      location.pathname === '/forgot-password' ||
      location.pathname === '/forgetpassword'
    ) {
      setSlideDirection('right');
      setActiveStep(LOGIN_STEPS.FORGOT);
    } else if (location.pathname === '/login') {
      setSlideDirection('left');
      setActiveStep(LOGIN_STEPS.LOGIN);
    }
  }, [location.pathname]);

  const switchStep = (step: LoginStep) => {
    if (step === activeStep) return;
    if (step === LOGIN_STEPS.SIGNUP) {
      setSlideDirection('right');
    } else if (step === LOGIN_STEPS.LOGIN) {
      setSlideDirection('left');
    } else if (step === LOGIN_STEPS.FORGOT || step === LOGIN_STEPS.VERIFY_NOTICE) {
      setSlideDirection('right');
    } else {
      setSlideDirection('left');
    }
    setActiveStep(step);
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
          email: formValues.email.trim(),
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

  // 5. Handle Legacy Username Step 2 Submit
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

  const isTabVisible = activeStep === LOGIN_STEPS.LOGIN || activeStep === LOGIN_STEPS.SIGNUP;

  return (
    <div className={styles.authContainer}>
      <div className={styles.ambientGlow1} aria-hidden="true" />
      <div className={styles.ambientGlow2} aria-hidden="true" />
      <div className={styles.patternOverlay} aria-hidden="true" />

      <div className={styles.authCard}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoWrapper}>
            <img src={LogoWhite} alt="Odyssey" className={`${styles.brandLogo} ${styles.brandLogoDark}`} />
            <img src={LogoBlack} alt="Odyssey" className={`${styles.brandLogo} ${styles.brandLogoLight}`} />
          </div>
          <h1 className={styles.brandTitle}>
            Odyssey
          </h1>
          <p className={styles.brandSubtitle}>
            {activeStep === LOGIN_STEPS.LOGIN && 'Welcome back! Sign in to continue talking.'}
            {activeStep === LOGIN_STEPS.SIGNUP && 'Join today and connect seamlessly across devices.'}
            {activeStep === LOGIN_STEPS.FORGOT && 'Trouble logging in? We’ll help you get back in.'}
            {activeStep === LOGIN_STEPS.VERIFY_NOTICE && 'One last step to secure your account.'}
            {activeStep === LOGIN_STEPS.USERNAME && 'Choose your unique handle to finish setup.'}
          </p>
        </div>

        {/* Tab Switcher (Log in / Sign up) */}
        {isTabVisible && (
          <div className={styles.segmentTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeStep === LOGIN_STEPS.LOGIN}
              className={`${styles.segmentTab} ${
                activeStep === LOGIN_STEPS.LOGIN ? styles.segmentTabActive : ''
              }`}
              onClick={() => switchStep(LOGIN_STEPS.LOGIN)}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeStep === LOGIN_STEPS.SIGNUP}
              className={`${styles.segmentTab} ${
                activeStep === LOGIN_STEPS.SIGNUP ? styles.segmentTabActive : ''
              }`}
              onClick={() => switchStep(LOGIN_STEPS.SIGNUP)}
            >
              Sign up
            </button>
          </div>
        )}

        <div className={styles.formContainer}>
          <div
            key={activeStep}
            className={`${styles.formSlider} ${
              slideDirection === 'right' ? styles.slideFromRight : styles.slideFromLeft
            }`}
          >
            {/* STEP 1: LOGIN */}
            {activeStep === LOGIN_STEPS.LOGIN && (
          <form className={styles.formBody} onSubmit={handleLoginSubmit} autoComplete="on">
            <div className={styles.fieldGroup}>
              <label htmlFor="login-email" className={styles.fieldLabel}>
                Email address
              </label>
              <Input
                type="email"
                name="email"
                id="login-email"
                placeholder="name@example.com"
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
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="login-password" className={styles.fieldLabel}>
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="login-password"
                  placeholder="Enter your password"
                  icon={faLock}
                  value={formValues.password}
                  onChange={handleChange('password')}
                  autoComplete="current-password"
                  size="md"
                  fullWidth
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className={styles.linkRow}>
              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => switchStep(LOGIN_STEPS.FORGOT)}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className={styles.buttonSpinner} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  <span>Sign in</span>
                </>
              )}
            </button>

            <div className={styles.switchPrompt}>
              <span>Don't have an account?</span>
              <button
                type="button"
                className={styles.switchAction}
                onClick={() => switchStep(LOGIN_STEPS.SIGNUP)}
              >
                Create one
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SIGNUP */}
        {activeStep === LOGIN_STEPS.SIGNUP && (
          <form className={styles.formBody} onSubmit={handleSignupSubmit} autoComplete="on">
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-username" className={styles.fieldLabel}>
                Username
              </label>
              <Input
                type="text"
                name="username"
                id="signup-username"
                placeholder="Choose a username"
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
              <span className={styles.fieldHint}>5–24 characters: letters, numbers, and underscores</span>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="signup-email" className={styles.fieldLabel}>
                Email address
              </label>
              <Input
                type="email"
                name="email"
                id="signup-email"
                placeholder="name@example.com"
                icon={faEnvelope}
                value={formValues.email}
                onChange={handleChange('email')}
                autoComplete="email"
                autoCapitalize="none"
                size="md"
                fullWidth
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="signup-password" className={styles.fieldLabel}>
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="signup-password"
                  placeholder="Create a strong password"
                  icon={faLock}
                  value={formValues.password}
                  onChange={handleChange('password')}
                  autoComplete="new-password"
                  size="md"
                  fullWidth
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              <span className={styles.fieldHint}>Must include uppercase, lowercase, number & symbol</span>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className={styles.buttonSpinner} />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  <span>Create Account</span>
                </>
              )}
            </button>

            <div className={styles.switchPrompt}>
              <span>Already have an account?</span>
              <button
                type="button"
                className={styles.switchAction}
                onClick={() => switchStep(LOGIN_STEPS.LOGIN)}
              >
                Log in
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: FORGOT PASSWORD */}
        {activeStep === LOGIN_STEPS.FORGOT && (
          <form className={styles.formBody} onSubmit={handleForgotSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="forgot-email" className={styles.fieldLabel}>
                Registered email
              </label>
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
              <span className={styles.fieldHint}>
                We will email you a secure link to reset your account credentials.
              </span>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className={styles.buttonSpinner} />
                  <span>Sending link...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>

            <div className={styles.backButtonRow}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => switchStep(LOGIN_STEPS.LOGIN)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back to login</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: VERIFY NOTICE & RESEND */}
        {activeStep === LOGIN_STEPS.VERIFY_NOTICE && (
          <div className={styles.formBody}>
            <div className={styles.verifyIconBox}>
              <FontAwesomeIcon icon={faEnvelopeOpenText} />
            </div>

            <div className={styles.emailPill}>{formValues.email}</div>

            <p className={styles.brandSubtitle} style={{ textAlign: 'center' }}>
              We've dispatched a verification link to your email. Click it to verify your account,
              then log in to start chatting.
            </p>

            <button
              type="button"
              className={styles.outlineButton}
              disabled={isResending}
              onClick={handleResendVerification}
            >
              {isResending ? 'Sending email...' : 'Resend Verification Email'}
            </button>

            <button
              type="button"
              className={styles.submitButton}
              onClick={() => switchStep(LOGIN_STEPS.LOGIN)}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* STEP 5: USERNAME STEP 2 ONBOARDING */}
        {activeStep === LOGIN_STEPS.USERNAME && (
          <form className={styles.formBody} onSubmit={handleUsernameSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="onboard-username" className={styles.fieldLabel}>
                Choose your username
              </label>
              <Input
                value={formValues.username}
                onChange={handleChange('username')}
                type="text"
                name="username"
                id="onboard-username"
                placeholder="e.g. alex_rivera"
                icon={faUser}
                autoFocus
                size="md"
                fullWidth
              />
              <span className={styles.fieldHint}>
                This is how other users on Odyssey will discover and mention you.
              </span>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className={styles.buttonSpinner} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Complete Setup</span>
              )}
            </button>
          </form>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
