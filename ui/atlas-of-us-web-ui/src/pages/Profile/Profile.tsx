import "./profile.css";
import { useEffect, useState } from "react";
import { NavBar } from "../../common-components/navbar/nav";
import { HttpService } from "../../services/http-service";
import { jwtDecode } from "jwt-decode";
import { Neo4jApiResponse, Neo4jNode } from "../Graph/graph-interfaces.interface";

export function Profile() {
  const httpService = new HttpService();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState([] as unknown as Neo4jApiResponse);
  const [avatarImgUrl, setAvatarImgUrl] = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decoded = jwtDecode(jwt);
      const username = decoded.iss;

      httpService
        .fetchNodes(`/api/secure/profile/user-profile/${username}`)
        .then((response) => {
          setLoading(false);
          setProfileData(response);
          console.log(response);

          //@ts-ignore
          httpService
            .getS3Object(
              "atlas-of-us-general-bucket",
              response.nodeRoot.Props.avatar
            )
            .then((imgBlob) => {
              setAvatarImgUrl(URL.createObjectURL(imgBlob));
            });
        });
    }
  }, []);

  return (
    <>
      <NavBar />
      <div className="in-nav-container dark-background">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="profile-container">
            <div className="profile-header">
              <img src={avatarImgUrl} alt="User avatar" className="avatar" />
              <div className="basic-info">
                <h1>{profileData.nodeRoot.Props.fullName}</h1>
                <p>@{profileData.nodeRoot.Props.username}</p>
                <p>{profileData.nodeRoot.Props.email}</p>
                <p>🎂 {profileData.nodeRoot.Props.birthday}</p>
              </div>
            </div>

            <div className="profile-section">
              <h2>Skills</h2>
              <div className="tag-list">
                {profileData.affiliates?.map(
                  (skill: Neo4jNode) =>
                    skill.Labels.includes("Skill") && (
                      <span key={skill.ElementId} className="tag">
                        {skill.Props["name"]}
                      </span>
                    )
                )}
              </div>
            </div>

            <div className="profile-section">
              <h2>Knowledge Bases</h2>
              <div className="tag-list">
                {profileData.affiliates?.map(
                  (knowledge: Neo4jNode) =>
                    knowledge.Labels.includes("Knowledge") && (
                      <span key={knowledge.ElementId} className="tag">
                        {knowledge.Props["name"]}
                      </span>
                    )
                )}
              </div>
            </div>

            <div className="profile-section">
              <h2>Pursuits</h2>
              <div className="tag-list">
                {profileData.affiliates?.map(
                  (pursuit: Neo4jNode) =>
                    pursuit.Labels.includes("Pursuit") && (
                      <span key={pursuit.ElementId} className="tag">
                        {pursuit.Props["name"]}
                      </span>
                    )
                )}
              </div>
            </div>

            <div className="profile-section">
              <h2>Personality Traits</h2>
              <div className="tag-list">
                {profileData.affiliates?.map((personality: Neo4jNode) => {
                  if (personality.Labels.includes("Personality")) {
                    const relationship = profileData.relationships.find((node) => node.EndElementId === personality.ElementId);
                    const strength = relationship.Props["strength"];
                    let strengthClass = "";

                    if (strength >= 0 && strength <= 3) {
                      strengthClass = "strength-low";
                    } else if (strength >= 4 && strength <= 7) {
                      strengthClass = "strength-medium";
                    } else if (strength >= 8 && strength <= 10) {
                      strengthClass = "strength-high";
                    }

                    return (
                      <span key={personality.ElementId} className="tag">
                        {personality.Props["name"]} - {" "}
                        <span className={strengthClass}>{strength}</span>
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="profile-section">
              <h2>Organizations (Coming Soon)</h2>
              <ul className="org-list"></ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
