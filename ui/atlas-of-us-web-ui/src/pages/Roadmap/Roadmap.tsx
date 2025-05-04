import { NavBar } from "../../common-components/navbar/nav";
import "./roadmap.css";

export function Roadmap() {
  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        <div className="roadmap-container">
          <h1 className="roadmap-h1">ROADMAP</h1>
          <p>
            Upcoming items are listed in order with a rough estimate of
            completion progress next to it.
          </p>
          <ul>
            <li>FINISH PROTOTYPE <span className="chip in-progress">In Progress</span> - 50%</li>
            <li>GROW COMMUNITY <span className="chip in-progress">In Progress</span> - 1%</li>
            <li>
              ADD FEATURES
              <ul>
                <li>How to guides - 0%</li>
                <li>Leaderboards - 0%</li>
                <li>Job matcher - 0%</li>
                <li>Tinder/hinge but better (relationship matcher) - 0%</li>
                <li>Fortune telling / horoscopes - 0%</li>
                <li>Mini Games like generating an animal to represent you - 0%</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
