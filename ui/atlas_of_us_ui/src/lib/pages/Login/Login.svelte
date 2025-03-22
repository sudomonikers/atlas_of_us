<script lang="ts">
  import { API_BASE } from "../../../environment";
  import { goto } from "@mateothegreat/svelte5-router";

  let { loggedIn = $bindable() } = $props();

  //login form stuff
  let username = $state("");
  let password = $state("")

  //create account form stuff
  let createAccountUsername = $state("")
  let createAccountPassword = $state("")
  let createAccountPassword2 = $state("")
  let createAccountPhone = $state("")

  async function handleLogin() {
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
      localStorage.setItem("jwt", responseBody);
      loggedIn = true;
      goto("/Graph");
    } else {
      console.error("Login failed");
    }
  }

  async function handleCreateAccount() {

  }
</script>

<div class="in-nav-container">
  <h2>Login</h2>
  <form on:submit|preventDefault={handleLogin}>
    <label for="username">Username:</label>
    <input type="text" id="username" bind:value={username} />

    <label for="password">Password:</label>
    <input type="password" id="password" bind:value={password} />

    <button type="submit">Login</button>
  </form>

  <div class="or-container">OR</div>

  <h2>New Here? Create an Account!</h2>
  <form on:submit|preventDefault={handleCreateAccount}>
    <label for="create-username">Username:</label>
    <input type="text" id="ucreate-sername" bind:value={createAccountUsername} />

    <label for="create-username">Phone:</label>
    <input type="text" id="ucreate-sername" bind:value={createAccountPhone} />

    <label for="create-password">Password:</label>
    <input type="password" id="create-password" bind:value={createAccountPassword} />

    <label for="create-password2">Let's double check that password...</label>
    <input type="password" id="create-password2" bind:value={createAccountPassword2} />

    <button type="submit">Create Account!</button>
  </form>
</div>

<style>
  .in-nav-container {
    text-align: left;
    max-width: 300px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  h2 {
    text-align: center;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
    max-width: 300px;
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
    display: block;
  }

  button:hover {
    background-color: #3e8e41;
  }

  .or-container {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin: 20px 0;
  }

  .or-container::before,
  .or-container::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid white;
    margin: 0 10px;
  }
</style>
