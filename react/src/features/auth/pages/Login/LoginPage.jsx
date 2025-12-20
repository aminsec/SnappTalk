import { useState } from 'react';
import toast from 'react-hot-toast';
import { faUser, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

import logo from '@/shared/assets/images/logo.png';
import sliderImage from '@/shared/assets/images/Slider.png';
import { Button, Input } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import styles from './Login.module.css';

const LOGIN_STEPS = {
  CREDENTIALS: 1,
  USERNAME: 2,
};

function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [activeStep, setActiveStep] = useState(LOGIN_STEPS.CREDENTIALS);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCredentials = () => {
    if (!formValues.email || !formValues.password) {
      toast.error('Please fill in all fields.');
      return false;
    }

    if (formValues.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const credentialsAreValid = validateCredentials();

    if (!credentialsAreValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/auth/', {
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
        setIsAnimating(true);
        setTimeout(() => {
          setActiveStep(LOGIN_STEPS.USERNAME);
          setIsAnimating(false);
        }, 300);
        toast.success('Please choose a username to finish onboarding.');
        return;
      }

      await refreshUser();
      navigate('/chats', { replace: true });
      toast.success('Welcome back!');
    } catch (error) {
      const message = error?.message || 'Something went wrong while signing in.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const username = formValues.username.trim();

    if (!username) {
      const message = 'Please enter a username.';
      toast.error(message);
      return;
    }

    if (username.length > 24) {
      const message = 'Username can be at most 24 characters.';
      toast.error(message);
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      const message = 'Username can include letters, numbers, "." or "_".';
      toast.error(message);
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
    } catch (error) {
      const message = error?.message || 'Unable to complete onboarding.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.popUp} ${isAnimating ? 'form-fade' : ''}`}>
        <div className={styles.slider}>
          <img src={sliderImage} alt="Slider" className={styles.sliderImage} />
        </div>
        <div className={styles.form}>
          <img src={logo} alt="Logo" className={styles.logo} />

          {activeStep === LOGIN_STEPS.CREDENTIALS ? (
            <>
              <h2 className={styles.Titr}>Login to your account</h2>
              <h4 className={styles.Discription}>Enter your email address and password to login</h4>

              <form className={styles['form-inputs']} onSubmit={handleCredentialsSubmit}>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  icon={faEnvelope}
                  value={formValues.email}
                  onChange={handleChange('email')}
                  size="md"
                  fullWidth
                />

                <Input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  icon={faLock}
                  value={formValues.password}
                  onChange={handleChange('password')}
                  size="md"
                  fullWidth
                />

                <a className="form-link" href="/forgetpassword">
                  Forgot Password
                </a>

                <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait...' : 'Login'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className={styles.Titr}>Enter Username</h2>
              <h4 className={styles.Discription}>Please enter your username to complete login</h4>

              <form className={styles['form-inputs']} onSubmit={handleUsernameSubmit}>
                <Input
                  value={formValues.username}
                  onChange={handleChange('username')}
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Username"
                  icon={faUser}
                  autoFocus
                  size="md"
                  fullWidth
                  className="slide-in"
                />
                <Button type="submit" size="lg" className="slide-in" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
