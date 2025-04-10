import { NavBar } from "../../common-components/navbar/nav";
import redditLogo from "../../assets/Reddit_Lockup.png";
import WidgetBot from "./DiscordEmbed/DiscordEmbed";
import "./community.css";
import { Link } from "react-router";

export function Community() {
  return (
    <>
      <NavBar />
      <div className="in-nav-container community-container">
        <h1 className="big-h1">
          <i>Get involved with like-minded people in our community!</i>
        </h1>
        <p>Join us on our Discord server to chat about anything AOU related or just to hang out! We will have lots of community events and activities to participate in so get involved!</p>
        <div className="image-container">
          <WidgetBot
            server="1359635637745221772"
            channel="1359635637745221775"
            width={"80%"}
            height={"400px"}
          />
          <div className="or-container">
            <div className="line line-black"></div>
            <div className="or-text">OR</div>
            <div className="line line-black"></div>
          </div>
          <p>Join us on <Link to={"https://www.reddit.com/r/Atlas_Of_Us/"} target="_blank">Reddit!</Link></p>
          <a
            className="image-link"
            target="_blank"
            href="https://www.reddit.com/r/Atlas_Of_Us/"
          >
            <img className="img" src={redditLogo} />
          </a>
        </div>
      </div>
    </>
  );
}
