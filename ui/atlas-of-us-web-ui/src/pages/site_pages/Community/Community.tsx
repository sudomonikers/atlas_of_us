import { NavBar } from "../../../common-components/navbar/nav";
import WidgetBot from "./DiscordEmbed/DiscordEmbed";
import "./community.css";

export function Community() {
  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        <div className="community-container">
          <h1 className="big-h1">
            Get involved with like-minded people in our community!
          </h1>
          <p className="description">
            Growing as a person and becoming better is not an easy task.
            Luckily, you don't have to do it alone! The Atlas Of Us has several
            friendly and helpful communities to help YOU be the best person you
            can be. Come hang out in Discord where we have text and voice
            channels to get advice or just to chat, or head over to Reddit for a
            more asynchronous community experience.
          </p>

          <div className="screenshot">
            <WidgetBot
              server="1359635637745221772"
              channel="1359635637745221775"
              width={"100%"}
              height={"400px"}
            />{" "}
          </div>

          <div className="buttons">
            <a href="https://discord.gg/Rdy3meNbGP" className="btn-discord">
              Join us on Discord
            </a>
          </div>

          <div className="or-container">
            <div className="line line-black"></div>
            <div className="or-text">OR</div>
            <div className="line line-black"></div>
          </div>

          <div className="buttons">
            <a
              href="https://www.reddit.com/r/Atlas_Of_Us/"
              className="btn-reddit"
            >
              Join us on Reddit
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
