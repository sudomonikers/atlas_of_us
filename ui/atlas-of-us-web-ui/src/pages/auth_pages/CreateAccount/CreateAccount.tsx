import { useState } from "react";
import "./createAccount.css";
import { NavBar } from "../../../common-components/navbar/nav";
import { Link, useNavigate } from "react-router";
import { useGlobal } from "../../../GlobalProvider";
import { HttpService } from "../../../services/http-service";
import { Canvas, useFrame } from "@react-three/fiber";
import { AssessmentWorld, WorldState } from "../../graph_pages/Assessment/AssessmentWorld";

function CameraAnimation(): null {
  useFrame(({ camera }) => {
    const time = Date.now() * 0.00005;
    const radius = 180;
    camera.position.x = Math.cos(time) * radius;
    camera.position.z = Math.sin(time) * radius;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function CreateAccount() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const httpService = new HttpService();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const { setLoggedIn, setProfileData } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [worldState, setWorldState] = useState<WorldState>({
    skyColor: '#1a1a2e',
    starIntensity: 4,
    cameraTarget: [0, 0, 0]
  });
  const [targetWorldState, setTargetWorldState] = useState<WorldState>({
    skyColor: '#1a1a2e',
    starIntensity: 4,
    cameraTarget: [0, 0, 0]
  });

  async function handleCreateAccount() {
    setLoading(true);
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Phone number is required.");
      setLoading(false);
      return;
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          email,
          phone: phoneNumber,
        }),
      });

      if (response.ok) {
        console.log("Account created successfully");
        const responseBody = await response.json();
        localStorage.setItem("jwt", responseBody.token);
        
        httpService
          .fetchNodes(`secure/profile/user-profile/${username}`)
          .then((response) => {
            console.log('profile data: ', response)
            setLoggedIn(true);
            setProfileData(response);
            setLoading(false);
            navigate("/Assessment");
          });
      } else {
        let errorMessage = "Account creation failed. Please try again.";
        
        if (response.status === 400) {
          errorMessage = "Invalid input. Please check your information.";
        } else if (response.status === 409) {
          errorMessage = "Username or email already exists.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Create account error:", error);
      setLoading(false);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  }

  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        <div className="create-account-world-container">
          <Canvas className="create-account-world-canvas" flat camera={{ position: [0, 0, 180], far: 5000 }}>
            <CameraAnimation />
            <AssessmentWorld 
              worldState={worldState}
              setWorldState={setWorldState}
              targetWorldState={targetWorldState}
            />
          </Canvas>
        </div>
        
        <div className="create-account-container card-cosmic">
          <h1 className="text-h1">Welcome to Atlas of Us!</h1>
          <p className="text-body-large">Begin your journey of self-discovery and growth...</p>
          <br />
          <div className="mb-md">

            <input
              className="input-cosmic"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-md">

            <input
              className="input-cosmic"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-md">

            <input
              className="input-cosmic"
              id="phoneNumber"
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="mb-md">

            <input
              className="input-cosmic"
              id="password"
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-md">

            <input
              className="input-cosmic"
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="mt-lg flex-center gap-md">
            <button className="btn-cosmic interactive-particle" type="button" onClick={handleCreateAccount} disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid transparent', borderTop: '2px solid currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
          {error && (
            <div className="error-message text-body" style={{ color: 'var(--color-error, #ff4444)', textAlign: 'center', marginTop: 'var(--space-md)' }}>
              {error}
            </div>
          )}
          <div className="or-container">
            <div className="line"></div>
            <div className="or-text">OR</div>
            <div className="line"></div>
          </div>
          <h2 className="text-h2">Already Have an Account?</h2>
          <p className="text-body">
            <Link className="btn-glass interactive-particle" to="/Login">Sign in to continue your journey.</Link> 
          </p>
        </div>
      </div>
    </>
  );
}