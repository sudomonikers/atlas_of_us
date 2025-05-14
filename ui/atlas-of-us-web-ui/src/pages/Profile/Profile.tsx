import "./profile.css";
import { useEffect, useState } from "react";
import { NavBar } from "../../common-components/navbar/nav";
import { HttpService } from "../../services/http-service";
import { jwtDecode } from "jwt-decode";
import { Neo4jApiResponse, Neo4jNode } from "../Graph/graph-interfaces.interface";
import { NeuroticTraits } from "./personality.map";

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
                {profileData.affiliates?.map((node: Neo4jNode) => {
                  if (node.Labels.includes("Skill")) {
                    const userRelationship = profileData.relationships.find((r) => r.EndElementId === node.ElementId);

                    return (
                      <span key={node.ElementId} className="tag">
                        {node.Props["name"]}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="profile-section">
              <h2>Knowledge</h2>
              <div className="tag-list">
                {profileData.affiliates?.map((node: Neo4jNode) => {
                  if (node.Labels.includes("Knowledge")) {
                    const userRelationship = profileData.relationships.find((r) => r.EndElementId === node.ElementId);

                    return (
                      <span key={node.ElementId} className="tag">
                        {node.Props["name"]}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="profile-section">
              <h2>Pursuits</h2>
              <div className="tag-list">
                {profileData.affiliates?.map((node: Neo4jNode) => {
                  if (node.Labels.includes("Pursuit")) {
                    const userRelationship = profileData.relationships.find((r) => r.EndElementId === node.ElementId);

                    return (
                      <span key={node.ElementId} className="tag">
                        {node.Props["name"]}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="profile-section">
              <h2>Health</h2>
              <div className="tag-list">
                {profileData.affiliates?.map((node: Neo4jNode) => {
                  if (node.Labels.includes("Health")) {
                    const userRelationship = profileData.relationships.find((r) => r.EndElementId === node.ElementId);

                    return (
                      <span key={node.ElementId} className="tag">
                        {node.Props["name"]}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="profile-section">
              <h2>Personality Traits</h2>
              <div className="tag-list">
                {profileData.affiliates?.map((node: Neo4jNode) => {
                  if (node.Labels.includes("Personality")) {
                    const userRelationship = profileData.relationships.find((r) => r.EndElementId === node.ElementId);
                    const strength = userRelationship.Props["strength"];
                    let strengthClass = "";

                    const isNeurotic = NeuroticTraits.has(node.Props["name"]);

                    if (isNeurotic) {
                      // Opposite color logic for neurotic traits
                      if (strength >= 7 && strength <= 10) {
                        strengthClass = "strength-low";
                      } else if (strength >= 4 && strength <= 6) {
                        strengthClass = "strength-medium";
                      } else if (strength >= 0 && strength <= 3) {
                        strengthClass = "strength-high";
                      }
                    } else {
                      // Normal color logic for non-neurotic traits
                      if (strength >= 0 && strength <= 3) {
                        strengthClass = "strength-low";
                      } else if (strength >= 4 && strength <= 7) {
                        strengthClass = "strength-medium";
                      } else if (strength >= 8 && strength <= 10) {
                        strengthClass = "strength-high";
                      }
                    }

                    return (
                      <span key={node.ElementId} className="tag">
                        {node.Props["name"]} - {" "}
                        <span className={strengthClass}>{strength}</span>
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="profile-section">
              <h2>Demographics</h2>
              <div className="tag-list">
                {profileData.affiliates?.map((node: Neo4jNode) => {
                  if (node.Labels.includes("Demographics")) {
                    const userRelationship = profileData.relationships.find((r) => r.EndElementId === node.ElementId);
                    const value = userRelationship.Props['value'];

                    return (
                      <span key={node.ElementId} className="tag">
                        {node.Props["name"]} - {" "}
                        <span>{value}</span>
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
