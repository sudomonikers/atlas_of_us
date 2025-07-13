import "./signup.css";
import { useNavigate } from "react-router";
import { NavBar } from "../../common-components/navbar/nav";
import { useState } from "react";
import { useGlobal } from "../../GlobalProvider";

export function Signup() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const { loggedIn, setLoggedIn } = useGlobal();

  async function handleSignup() {
    try {
      const response = await fetch(`${apiBaseUrl}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          phone
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
          <h1>Create an Account!</h1>
          <p>Here's why you should create an account...</p>
          <div className="form-fields">
            <div className="form-field">
              <label htmlFor="username">Username:</label>
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone Number:</label>
              <input
                id="phone"
                type="phone"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="confirm_password">Confirm Password:</label>
              <input
                id="confirm_password"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-10">
            <button
              className="aou-button mr-10"
              type="button"
              onClick={handleSignup}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}