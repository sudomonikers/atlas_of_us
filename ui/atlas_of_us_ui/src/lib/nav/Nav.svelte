<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { route, Router, type Route } from "@mateothegreat/svelte5-router";

  import ThreeScene from "../pages/ThreeScene/ThreeScene.svelte";
  import Profile from "../pages/Profile/Profile.svelte";
  import PageNotFound from "../pages/PageNotFound/PageNotFound.svelte";
  import Login from "../pages/Login/Login.svelte";
  import Signup from "../pages/Signup/Signup.svelte";
  import Community from "../pages/Community/Community.svelte";
  import Graph from "../pages/Graph/Graph.svelte";
  import Roadmap from "../pages/Roadmap/Roadmap.svelte";
  import Contact from "../pages/Contact/Contact.svelte";

  let menuOpen = $state(false);
  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  const routes: Route[] = [
    {
      path: "^/$", //base path
      component: ThreeScene,
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
      component: Graph,
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

  onMount(() => {});
</script>

<nav>
  <button class="hamburger-button" onclick={toggleMenu}>
    {#if menuOpen}
      <svg viewBox="0 0 100 100" width="40">
        <path class="line line-cross1" d="M 10 10 L 90 90" />
        <path class="line line-cross2" d="M 90 10 L 10 90" />
      </svg>
    {:else}
      <svg viewBox="0 0 100 100" width="40">
        <path class="line line-burger1" d="M 10 30 H 90" />
        <path class="line line-burger2" d="M 10 70 H 90" />
      </svg>
    {/if}
  </button>
</nav>
{#if menuOpen}
  <div transition:slide class="nav-container">
    <ul>
      <li>
        <a
          use:route
          onclick={() => (menuOpen = false)}
          target="_blank"
          href="/"
          data-text="Atlas Of Us">Atlas Of Us</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={() => (menuOpen = false)}
          target="_blank"
          href="/Profie"
          data-text="My Profile">My Profile</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={() => (menuOpen = false)}
          target="_blank"
          href="/Community"
          data-text="Community">Community</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={() => (menuOpen = false)}
          target="_blank"
          href="/Graph"
          data-text="Explore The Graph">Explore The Graph</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={() => (menuOpen = false)}
          target="_blank"
          href="/Roadmap"
          data-text="Roadmap">Roadmap</a
        >
      </li>
      <li>
        <a
          use:route
          onclick={() => (menuOpen = false)}
          target="_blank"
          href="/Contact"
          data-text="Get In Touch">Get In Touch</a
        >
      </li>
    </ul>
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
    justify-content: center;
  }
  .nav-container {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.5);
    height: calc(100vh - 60px);
    width: 100vw;
    top: 60px;
    left: 0;
    z-index: 1000;
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

  .hamburger-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .line {
    stroke: black;
    stroke-width: 5;
    transition: all 3s;
  }

  .line-burger1 {
    transform-origin: center;
    transition: transform 3s;
  }

  .line-burger2 {
    transform-origin: center;
    transition: transform 3s;
  }

  .line-cross1 {
    transform-origin: center;
    transition: transform 3s;
  }

  .line-cross2 {
    transform-origin: center;
    transition: transform 3s;
  }
</style>
