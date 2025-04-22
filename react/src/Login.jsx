import { useState, useEffect } from 'react'
import './assets/css/style.css'
import './assets/css/login.css'
import logo from './assets/images/logo.png'
import sliderImage from './assets/images/Slider.png'

function Login() {

  const [emailState, setEmailState] = useState('');
  const [usernameState, setUsernameState] = useState('');
  const [passwordState, setPasswordState] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [loginStep, setLoginStep] = useState(1);

  const [isAnimating, setIsAnimating] = useState(false);

  const handleFirstStep = (e) => {
    e.preventDefault();


    if (!emailState.trim() || !passwordState.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      setLoginStep(2);
      setIsAnimating(false);
      setErrorMessage('');
    }, 300);
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();

    if (!usernameState.trim()) {
      setErrorMessage('Please enter your username');
      return;
    }

  };

  const [errorMessage, setErrorMessage] = useState("");
  const [emailState, setEmailState] = useState();
  const [passwordState, setPasswordState] = useState();

  async function loginRequest(e) {
    e.preventDefault();


    const usernameCheckRegex = new RegExp("^[a-zA-Z0-9_]+$");

    if (usernameCheckRegex.test(usernameState) === false) {
      setErrorMessage("Invalid username.");
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
      console.log(resp.message)

    if (!request.ok) {
      const resp = request.json();

      setErrorMessage(resp.message)
    } else {
      window.location.href = "/chats"
    }
  }

  return (
    <div className="loginPage">
      <div className={`popUp ${isAnimating ? 'form-fade' : ''}`}>
        <div className="slider">
          <img src={sliderImage} alt="Slider Image" className="sliderImage" />
        </div>
        <div className="form">
          <img src={logo} alt="Logo" className="logo" />

          {loginStep === 1 ? (
            <>
              <h2 className="Titr">Log in to your account.</h2>
              <h4 className="Discription">Enter your email address and password to log in.</h4>

              <form className="form-inputs" onSubmit={handleFirstStep}>
                <div className="textbox">
                  <svg className="icon" width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.9026 6.85114L12.4593 10.4642C11.6198 11.1302 10.4387 11.1302 9.59921 10.4642L5.11842 6.85114" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M15.9089 19C18.9502 19.0084 21 16.5095 21 13.4384V6.57001C21 3.49883 18.9502 1 15.9089 1H6.09114C3.04979 1 1 3.49883 1 6.57001V13.4384C1 16.5095 3.04979 19.0084 6.09114 19H15.9089Z" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    onChange={e => setEmailState(e.target.value)}
                    type="email"
                    name="email"
                    id="email"
                    className="input"
                    placeholder="Email"
                  />
                </div>

                <div className="textbox">
                  <svg className="icon" width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.4234 7.4478V5.3008C13.4234 2.7878 11.3854 0.7498 8.8724 0.7498C6.3594 0.7388 4.3134 2.7668 4.3024 5.2808V5.3008V7.4478" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M12.6832 19.2496H5.0422C2.9482 19.2496 1.2502 17.5526 1.2502 15.4576V11.1686C1.2502 9.07359 2.9482 7.37659 5.0422 7.37659H12.6832C14.7772 7.37659 16.4752 9.07359 16.4752 11.1686V15.4576C16.4752 17.5526 14.7772 19.2496 12.6832 19.2496Z" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.8629 12.2027V14.4237" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    onChange={e => setPasswordState(e.target.value)}
                    type="password"
                    name="password"
                    id="password"
                    className="input"
                    placeholder="Password"
                  />
                </div>

                <p className='Error-message'>{errorMessage}</p>
                <a href="/forgetpassword">Forgot Password!</a>

                <button type="submit" className="LoginBtn">Login</button>
              </form>
            </>
          ) : (
            <>
              <h2 className="Titr">Enter Username</h2>
              <h4 className="Discription">Please enter your username to complete login</h4>

              <form className="form-inputs" onSubmit={handleUsernameSubmit}>
                <div className="textbox slide-in">
                  <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20.24 21.9999C20.24 17.7099 16.29 14.1999 12 14.1999C7.71 14.1999 3.76 17.7099 3.76 21.9999" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    onChange={e => setUsernameState(e.target.value)}
                    type="text"
                    name="username"
                    id="username"
                    className="input"
                    placeholder="Username"
                    autoFocus
                  />
                </div>

                <p className='Error-message'>{errorMessage}</p>

                <button type="submit" className="LoginBtn slide-in">Continue</button>
              </form>
            </>
          )}
          <h2 className="Titr">Log in to your account.</h2>
          <h4 className="Discription">Enter your email address and password to log in.</h4>
          
          <form className="form-inputs" onSubmit={loginRequest}>
            <div className="textbox">
              <svg className="icon" width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.9026 6.85114L12.4593 10.4642C11.6198 11.1302 10.4387 11.1302 9.59921 10.4642L5.11842 6.85114" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path fillRule="evenodd" clipRule="evenodd" d="M15.9089 19C18.9502 19.0084 21 16.5095 21 13.4384V6.57001C21 3.49883 18.9502 1 15.9089 1H6.09114C3.04979 1 1 3.49883 1 6.57001V13.4384C1 16.5095 3.04979 19.0084 6.09114 19H15.9089Z" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input onChange={e => {setEmailState(e.target.value)}} type="email" name="email" id="email" className="input" placeholder="Email" />
            </div>
            
            <div className="textbox">
              <svg className="icon" width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.4234 7.4478V5.3008C13.4234 2.7878 11.3854 0.7498 8.8724 0.7498C6.3594 0.7388 4.3134 2.7668 4.3024 5.2808V5.3008V7.4478" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12.6832 19.2496H5.0422C2.9482 19.2496 1.2502 17.5526 1.2502 15.4576V11.1686C1.2502 9.07359 2.9482 7.37659 5.0422 7.37659H12.6832C14.7772 7.37659 16.4752 9.07359 16.4752 11.1686V15.4576C16.4752 17.5526 14.7772 19.2496 12.6832 19.2496Z" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.8629 12.2027V14.4237" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input onChange={e => {setPasswordState(e.target.value)}} type="password" name="password" id="password" className="input" placeholder="Password" />
            </div>
            <p className='Error-message'>{errorMessage}</p>
            <a href="/forgetpassword">Forgot Password!</a>
            
            <button type="submit" className="LoginBtn">Login</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login