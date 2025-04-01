import { NavBar } from "../../common-components/navbar/nav";

export function Roadmap() {
  return (
    <>
      <NavBar/>
      <div className="in-nav-container">
        <ul>
          <li>finish prototype</li>
          <li>grow community</li>
          <li>
            add features
            <ul>
              <li>how to guides</li>
              <li>job finder</li>
              <li>tinder but better</li>
            </ul>
          </li>
        </ul>
      </div>
    </>
  );
}
