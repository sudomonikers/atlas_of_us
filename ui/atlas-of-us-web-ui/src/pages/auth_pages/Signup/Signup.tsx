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
        navigate("/Assessment");
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
          <h1 className="text-h1">Create an Account!</h1>
          <p className="text-body-large">Join the Atlas of Us and begin your journey of self-discovery...</p>
          <div className="form-fields">
            <div className="form-field">
              <label className="text-body mb-sm block" htmlFor="username">Username:</label>
              <input
                className="input-cosmic"
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="text-body mb-sm block" htmlFor="phone">Phone Number:</label>
              <input
                className="input-cosmic"
                id="phone"
                type="phone"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="text-body mb-sm block" htmlFor="password">Password:</label>
              <input
                className="input-cosmic"
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="text-body mb-sm block" htmlFor="confirm_password">Confirm Password:</label>
              <input
                className="input-cosmic"
                id="confirm_password"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-lg flex-center">
            <button
              className="btn-cosmic interactive-particle"
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