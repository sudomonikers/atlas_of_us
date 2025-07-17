import { useState } from "react";
import "./login.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Link, useNavigate } from "react-router";
import { useGlobal } from "../../GlobalProvider";

export function Login() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loggedIn, setLoggedIn } = useGlobal();

  async function handleLogin() {
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
        setLoggedIn(true);
        navigate("/Graph");
      } else {
        console.error("Login failed");
        // Handle login failure (e.g., display an error message)
      }
    } catch (error) {
      console.error("Login error:", error);
      // Handle network errors or other exceptions
    }
  }

  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        <div className="login-container card-cosmic">
          <h1 className="text-h1">Welcome Back!</h1>
          <p className="text-body-large">Time to see who you are, and who you might become...</p>
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
            <button className="btn-cosmic interactive-particle" type="button" onClick={handleLogin}>
              Sign In
            </button>
            <a className="btn-glass interactive-particle" href="#">
              Forgot Password?
            </a>
          </div>
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
