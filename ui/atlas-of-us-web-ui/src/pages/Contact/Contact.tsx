import { NavBar } from "../../common-components/navbar/nav";
import "./contact.css";
import contactImage from "../../assets/contact-image2.png";
import githubLogo from "../../assets/github-mark.png";
import { useRef } from "react";
import { Link } from "react-router";

export function Contact() {
  const imageContainerRef = useRef(null);

  const handleMouseMove = (event: any) => {
    const container = imageContainerRef.current;
    if (!container) return;

    const { clientX, clientY } = event;
    const { offsetLeft, offsetTop, clientWidth, clientHeight } = container;

    const x = clientX - offsetLeft;
    const y = clientY - offsetTop;

    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;

    const moveX = ((x - centerX) / centerX) * 2; // Adjust 10 for intensity
    const moveY = ((y - centerY) / centerY) * 2; // Adjust 10 for intensity

    container.style.transform = `perspective(500px) rotateX(${
      moveY * -1
    }deg) rotateY(${moveX}deg)`;
  };

  const handleMouseLeave = () => {
    const container = imageContainerRef.current;
    if (!container) return;

    container.style.transform = `perspective(500px) rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        <div className="contact-container">
          <div
            className="image-container"
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img src={contactImage} alt="Contact Image" />
          </div>
          <div className="content-container">
            {/* <i>
              <h1 className="big-h1">Atlas Of Us</h1>
            </i>

            <h3>
              Business Inquiries:{" "}
              <a href="mailto:andrew.link1999@gmail.com" target="_blank">
                andrewlink1999@gmail.com
              </a>
            </h3>
            <h3>
              Report a bug:{" "}
              <img src={githubLogo} className="github-logo"></img>
              <a
                href="https://github.com/sudomonikers/atlas_of_us/issues"
                target="_blank"
              >
               Add an issue in our github
              </a>
            </h3> */}
            <div className="content-container">
              <h1 className="main-heading">Atlas Of Us</h1>
              <h2 className="sub-heading">Start a conversation</h2>

              <div className="contact-section">
                <div className="contact-group">
                  <h3 className="group-title">BUSINESS INQUIRIES</h3>
                  <p className="contact-name">Andrew Link</p>
                  <a
                    href="mailto:andrew.link1999@gmail.com"
                    target="_blank"
                    className="contact-email"
                  >
                    andrew.link1999@gmail.com
                  </a>
                  <p className="contact-phone">+1 440 384 9525</p>
                </div>

                <div className="contact-group">
                  <h3 className="group-title">REPORT A BUG</h3>
                  <p className="contact-name">
                    <img src={githubLogo} className="github-logo"></img>
                  </p>
                  <a
                    href="https://github.com/sudomonikers/atlas_of_us/issues"
                    target="_blank"
                    className="contact-email"
                  >
                    Add an issue in our github
                  </a>
                </div>

                <div className="contact-group">
                  <h3 className="group-title">JUST WANNA CHAT?</h3>
                  <p className="contact-name">Visit our community page</p>
                  <Link to="/Community" data-text="Community" className="contact-email">
                    Community
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
