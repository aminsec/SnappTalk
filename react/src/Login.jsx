import { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast';
import { useContext } from 'react';
import { userStateContext } from './contexts/userState';
import './assets/css/login.css'
import logo from './assets/images/logo.png'
import sliderImage from './assets/images/Slider.png'
import {ICONS} from './icons.jsx'
import { useNavigate } from 'react-router-dom';

function Login() {
  const [emailState, setEmailState] = useState('');
  const [usernameState, setUsernameState] = useState('');
  const [passwordState, setPasswordState] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginStep, setLoginStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const { setUserState } = useContext(userStateContext);
  const navigate = useNavigate();

  const handleFirstStep = async (e) => {
    e.preventDefault();

    if(emailState === "" || passwordState === ""){
      toast.error("Please fill in all fields");
      return;
    }

    if(passwordState.length < 6){
      toast.error("Password must be at least 6 character");
      return;
    }

    const body = {
      email: emailState,
      password: passwordState
    };

    const request = await fetch("/api/v1/auth/", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if(!request.ok){
      const resp = await request.json();
      toast.error(resp.message);
      return;
    }

    if(request.ok){
      const resp = await request.json();
      if(resp.state === "success"){
        if(resp.step_2 === true){
          setIsAnimating(true);
          setTimeout(() => {
            setLoginStep(2);
            setIsAnimating(false);
            setErrorMessage('');
          }, 300);
        }else{
          setUserState(1); //Marking user as login
          navigate("/home");
        }
      }
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();

    if(usernameState === ""){
      toast.error("Please enter a username");
      return;
    }

    if(usernameState.length > 24){
      toast.error("Maximum lenght for username is 24 character");
      return;
    }

    const usernameRegex = new RegExp("^[a-zA-Z0-9_\.]+$");
    if(usernameRegex.test(usernameState) === false){
      toast.error(`Username can only include a-z, 0-9, "." and "_" `);
      return;
    }

    //Fetching user info to request an update to update username
    const userDataRequest = await fetch("/api/v1/user/info", {
      credentials: "include",
      method: "GET"
    });

    if(!userDataRequest.ok){
      const resp = await userDataRequest.json();
      toast.error(resp.message);
      return;
    }

    if(userDataRequest.ok){
      const resp = await userDataRequest.json();
      const userInfo = resp.userInfo;
      
      //Updating username
      userInfo.username = usernameState;
      const usernameUpdateRequest = await fetch("/api/v1/user/info", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo)
      });

      if(!usernameUpdateRequest.ok){
        const resp = await usernameUpdateRequest.json();
        toast.error(resp.message);

      }else{
        setUserState(1); //Marking user as login
        navigate("/home");
      }
    }
  };

  return (
    <div className="loginPage">
      <Toaster position="top-center" />
      <div className={`popUp ${isAnimating ? 'form-fade' : ''}`}>
        <div className="slider">
          <img src={sliderImage} alt="Slider Image" className="sliderImage" />
        </div>
        <div className="form">
          <img src={logo} alt="Logo" className="logo" />

          {loginStep === 1 ? (
            <>
              <h2 className="Titr">Login to your account</h2>
              <h4 className="Discription">Enter your email address and password to login</h4>

              <form className="form-inputs" onSubmit={handleFirstStep}>
                <div className="textbox">
                  <img src={ICONS.email} alt="Email Icon" className="icon" />
                  <input onChange={e => setEmailState(e.target.value)} type="email" name="email" id="email" className="input" placeholder="Email" />
                </div>

                <div className="textbox">
                  <img src={ICONS.password} alt="password Icon" className="icon" />
                  <input onChange={e => setPasswordState(e.target.value)} type="password" name="password" id="password" className="input" placeholder="Password" />
                </div>

                <p className='Error-message' >{errorMessage}</p>
                <a className='form-link' href="/forgetpassword">Forgot Password</a>

                <button type="submit" className="LoginBtn btn btn-lg">Login</button>
              </form>
            </>
          ) : (
            <>
              <h2 className="Titr">Enter Username</h2>
              <h4 className="Discription">Please enter your username to complete login</h4>

              <form className="form-inputs" onSubmit={handleUsernameSubmit}>
                <div className="textbox slide-in">
                  <img src={ICONS.userName} alt="Username Icon" className="icon" />
                  <input value={usernameState} onChange={e => setUsernameState(e.target.value)} type="text" name="username" id="username" className="input" placeholder="Username" autoFocus />
                </div>
                <p className='Error-message'>{errorMessage}</p>
                <button type="submit" className="LoginBtn slide-in btn btn-lg ">Continue</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
