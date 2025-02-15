<script lang="ts">
  import { API_BASE } from "../../../environment";

  let username = "";
  let password = "";

  async function handleSubmit() {
    console.log("Logging in with:", username, password);
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
      console.log("Response body:", responseBody);
      localStorage.setItem("jwt", responseBody)
    } else {
      console.error("Login failed");
    }
  }
</script>

<div class="in-nav-container">
  <h2>Login</h2>
  <form on:submit|preventDefault={handleSubmit}>
    <label for="username">Username:</label>
    <input type="text" id="username" bind:value={username} />

    <label for="password">Password:</label>
    <input type="password" id="password" bind:value={password} />

    <button type="submit">Login</button>
  </form>
</div>

<style>
  label {
    display: block;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
    padding: 8px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }

  button {
    background-color: #4caf50;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #3e8e41;
  }
</style>
