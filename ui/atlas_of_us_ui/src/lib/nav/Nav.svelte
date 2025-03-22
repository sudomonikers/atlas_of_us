<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { route, Router, type Route } from "@mateothegreat/svelte5-router";
  import { jwtDecode } from 'jwt-decode';

  import Profile from "../pages/Profile/Profile.svelte";
  import PageNotFound from "../pages/PageNotFound/PageNotFound.svelte";
  import Login from "../pages/Login/Login.svelte";
  import Signup from "../pages/Signup/Signup.svelte";
  import Community from "../pages/Community/Community.svelte";
  import Graph from "../pages/Graph/Graph.svelte";
  import Roadmap from "../pages/Roadmap/Roadmap.svelte";
  import Contact from "../pages/Contact/Contact.svelte";

  let menuOpen = $state(false);
  let loginMenuOpen = $state(false);
  let loggedIn = $state(false);
  let userInput = $state("");
  $effect(() => {
    console.log(userInput)
    if (loggedIn) {
      loginMenuOpen = false;
    }
  });

  function login() {
    console.log('logging in...')
    menuOpen = false;
    loginMenuOpen = true;
  }

  function toggleMenu() {
    loginMenuOpen = false;
    menuOpen = !menuOpen;
  }

  function handleNavigation() {
    menuOpen = false;
    const inputElement = document.getElementById("input") as HTMLInputElement;
    if (inputElement) {
      inputElement.value = "";
    }
  }

  const routes: Route[] = [
    {
      path: "^/$", //base path
      component: Graph
    },
    {
      path: ".+",
      component: PageNotFound,
    },
    {
      path: "Login",
      component: Login,
    },
    {
      path: "Signup",
      component: Signup,
    },
    {
      path: "/Profile",
      component: Profile,
      pre: (route: Route) => {
        console.log("pre hook #1 fired for route:", route);
        if (!localStorage.getItem("token")) {
          return {
            path: "/login",
            component: Login,
          };
        } else {
          return {
            path: "/Profile",
            component: Profile,
          };
        }
      },
    },
    {
      path: "Community",
      component: Community,
    },
    {
      path: "Graph",
      component: Graph
    },
    {
      path: "Roadmap",
      component: Roadmap,
    },
    {
      path: "Contact",
      component: Contact,
    },
  ];

  onMount(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      try {
        const decodedToken: { exp: number } = jwtDecode(jwt);
        const currentTime = Math.floor(Date.now() / 1000); // in seconds
        if (decodedToken?.exp < currentTime) {
          loggedIn = false;
          localStorage.removeItem('jwt');
        } else {
          loggedIn = true;
        }
      } catch (error) {
        loggedIn = false; 
        localStorage.removeItem('jwt');
      }
    } else {
      loggedIn = false;
    }
  });
</script>

<nav>
  <button class="microphone-button">
    <span class="material-symbols-outlined">mic_off</span>
  </button>
  <input type="text" id="input" class="nav-input" bind:value={userInput} />
  {#if !loggedIn}
    <button class="login-button" onclick={login}>Login</button>
  {/if}
  <button class="hamburger-button" onclick={toggleMenu} aria-label="Menu Toggle">
    <svg viewBox="0 0 100 100" width="40">
      <path class="line" d="M 10 25 H 90" class:line-burger1={!menuOpen} class:line-cross1={menuOpen} />
      <path class="line" d="M 10 75 H 90" class:line-burger2={!menuOpen} class:line-cross2={menuOpen} />
    </svg>
  </button>
</nav>
{#if menuOpen}
  <div transition:slide class="nav-container">
    <ul>
      <li>
        <a
          use:route
          onclick={handleNavigation}
          target="_blank"
          href="/Graph"
          data-text="Atlas Of Us">Atlas Of Us</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={handleNavigation}
          target="_blank"
          href="/Profile"
          data-text="My Profile">My Profile</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={handleNavigation}
          target="_blank"
          href="/Community"
          data-text="Community">Community</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={handleNavigation}
          target="_blank"
          href="/Roadmap"
          data-text="Roadmap">Roadmap</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={handleNavigation}
          target="_blank"
          href="/Contact"
          data-text="Get In Touch">Get In Touch</a
        >
      </li>
    </ul>
  </div>
{/if}
{#if loginMenuOpen}
  <div transition:slide class="nav-container">
    <Login bind:loggedIn={loggedIn}></Login>
  </div>
{/if}
<Router basePath="/" {routes} />

<style>
  @import url("https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@300&display=swap");

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Cairo", sans-serif;
  }
  nav {
    width: 100%;
    height: 60px;
    background-color: #fff;
    display: flex;
    justify-content: right;
    padding: 0 15px;
  }

  .nav-input {
    flex-grow: 1;
    margin: 15px;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 5px;
  }

  .login-button {
    margin: 15px;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 5px;
    background-color: #000;
    color: white; /* Ensure text is visible on the black background */
    display: flex; /* Use flexbox for vertical alignment */
    align-items: center; /* Vertically center the text */
    justify-content: center;
  }
  .login-button:hover {
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.7);
    outline: none; 
  }
  .login-button:active {
    box-shadow: 0 0 5px rgba(255, 8, 0, 0.89);
  }

  .microphone-button {
    background: none;
    border: none;
    padding: 0;
    margin-right: 5px; /* Add some spacing between the button and input */
    cursor: pointer;
    color: black;
    display: flex;
    align-items: center;
  }

  .nav-container {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.5);
    height: calc(100vh - 60px);
    width: 100vw;
    top: 60px;
    left: 0;
    z-index: 1000;
    overflow-y: scroll;
  }
  body {
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: center;
    min-height: 100vh;
    overflow: hidden;
    background: #dcd9cd;
  }
  ul {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  ul li {
    list-style: none;
    text-align: center;
  }
  ul li a {
    color: #fff;
    text-decoration: none;
    font-size: 3em;
    padding: 5px 20px;
    display: inline-flex;
    font-weight: 700;
    transition: 0.5s;
  }
  ul:hover li a {
    color: #fff;
  }
  ul li:hover a {
    color: #000;
    background: transparent;
  }
  ul li a:before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 5em;
    color: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    z-index: -1;
    opacity: 0;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 500px;
    transition:
      letter-spacing 0.5s,
      left 0.5s;
  }
  ul li a:hover:before {
    content: attr(data-text);
    opacity: 1;
    left: 50%;
    letter-spacing: 10px;
    width: 1800px;
    height: 1800px;
  }
  ul li:nth-child(6n + 1) a:before {
    background: #0470fe;
  }
  ul li:nth-child(6n + 2) a:before {
    background: #ff7675;
  }
  ul li:nth-child(6n + 3) a:before {
    background: #1582fe;
  }
  ul li:nth-child(6n + 4) a:before {
    background: #a29bfe;
  }
  ul li:nth-child(6n + 5) a:before {
    background: #fd79a8;
  }
  ul li:nth-child(6n + 6) a:before {
    background: #ffeaa7;
  }

  /**HAMBURGER MENU*/
  .hamburger-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .line {
    stroke: black;
    stroke-width: 5;
    transition: transform 0.7s ease;
  }

  .line-burger1 {
    transform: none; /* Reset all transforms */
    transform-origin: 50px 25px;
  }

  .line-burger2 {
    transform: none; /* Reset all transforms */
    transform-origin: 50px 75px;
  }

  .line-cross1 {
    transform-origin: 50px 25px;
    transform: translateY(25px) rotate(45deg);
  }

  .line-cross2 {
    transform-origin: 50px 75px;
    transform: translateY(-25px) rotate(-45deg);
  }
</style>
