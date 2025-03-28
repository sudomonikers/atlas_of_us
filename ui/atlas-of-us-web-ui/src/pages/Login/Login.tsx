import React, { useState } from 'react';
import "./login.css";
import { NavBar } from "../../common-components/navbar/nav";
import { useNavigate } from 'react-router';

export function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const API_BASE = 'http://localhost:8001';

  async function handleLogin() {
    try {
      const response = await fetch(
        `${API_BASE}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

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
    <div className="in-nav-container">
      <NavBar />
      <div className="">
        <div className="">
          <label className="" htmlFor="username">
            Username
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
            Password
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
        <div className="">
          <button
            className=""
            type="button"
            onClick={handleLogin}
          >
            Sign In
          </button>
          <a className="" href="#">
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
}