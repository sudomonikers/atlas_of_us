import { useState } from "react";
import "./login.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Link, useNavigate } from "react-router";
import { useGlobal } from "../../GlobalProvider";
import { HttpService } from "../../services/http-service";
import { Canvas, useFrame } from "@react-three/fiber";
import { AssessmentWorld, WorldState } from "../Assessment/AssessmentWorld";

function CameraAnimation(): null {
  useFrame(({ camera }) => {
    const time = Date.now() * 0.00005; // Slow rotation speed
    const radius = 180;
    camera.position.x = Math.cos(time) * radius;
    camera.position.z = Math.sin(time) * radius;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function Login() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const httpService = new HttpService();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.ok) {
        console.log("Logged in successfully");
        const responseBody = await response.json();
        localStorage.setItem("jwt", responseBody);
        
        httpService
          .fetchNodes(`secure/profile/user-profile/${username}`)
          .then((response) => {
            console.log('profile data: ', response)
            setLoggedIn(true);
            setProfileData(response);
            setLoading(false);
            if (response.nodeRoot.Props?.assessmentComplete) {
              navigate("/Graph");
            } else {
              navigate("/Assessment");
            }
          });
      } else {
        let errorMessage = "Login failed. Please try again.";
        console.log(response)
        
        if (response.status === 401) {
          errorMessage = "Invalid username or password.";
        } else if (response.status === 403) {
          errorMessage = "Access forbidden. Please check your credentials.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (response.status === 404) {
          errorMessage = "Login service not found.";
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  }

  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        <div className="login-world-container">
          <Canvas className="login-world-canvas" flat camera={{ position: [0, 0, 180], far: 5000 }}>
            <CameraAnimation />
            <AssessmentWorld 
              worldState={worldState}
              setWorldState={setWorldState}
              targetWorldState={targetWorldState}
            />
          </Canvas>
        </div>
        
        <div className="login-container card-cosmic">
          <h1 className="text-h1">Welcome Back!</h1>
          <p className="text-body-large">Time to see who you are, and who you might become...</p>
          <br />
          <div className="mb-md">
            <label className="text-body mb-sm block" htmlFor="username">
              Username:
            </label>
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
            <label className="text-body mb-sm block" htmlFor="password">
              Password:
            </label>
            <input
              className="input-cosmic"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mt-lg flex-center gap-md">
            <button className="btn-cosmic interactive-particle" type="button" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid transparent', borderTop: '2px solid currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : (
                'Sign In'
              )}
            </button>
            <a className="btn-glass interactive-particle" href="#">
              Forgot Password?
            </a>
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
          <h2 className="text-h2">New Here?</h2>
          <p className="text-body">
            <Link className="btn-glass interactive-particle" to="/Create">Create an account</Link> to experience the joy of
            clairvoyance.
          </p>
        </div>
      </div>
    </>
  );
}
