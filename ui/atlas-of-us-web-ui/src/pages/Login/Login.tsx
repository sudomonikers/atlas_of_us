import React, { useState } from "react";
import "./login.css";
import { NavBar } from "../../common-components/navbar/nav";
import { Link, useNavigate } from "react-router";

export function Login() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  async function handleLogin() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
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
        <div className="login-container">
          <h1>Welcome Back!</h1>
          <p>Time to see who you are, and who you might become...</p>
          <div className="">
            <label className="" htmlFor="username">
              Username:
            </label>
            <input
              className=""
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="">
            <label className="" htmlFor="password">
              Password:
            </label>
            <input
              className=""
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mt-10">
            <button className="aou-button mr-10" type="button" onClick={handleLogin}>
              Sign In
            </button>
            <a className="aou-button" href="#">
              Forgot Password?
            </a>
          </div>
          <div className="or-container">
            <div className="line"></div>
            <div className="or-text">OR</div>
            <div className="line"></div>
          </div>
          <h2>New Here?</h2>
          <Link to="/Create">Create an account</Link> to experience the joy of
          clairvoyance.
        </div>
      </div>
    </>
  );
}
