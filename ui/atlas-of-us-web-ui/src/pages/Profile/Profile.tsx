import { useEffect, useState } from "react";
import { NavBar } from "../../common-components/navbar/nav";
import { HttpService } from "../../services/http-service";
import { jwtDecode } from "jwt-decode";

export function Profile() {
  const httpService = new HttpService();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [avatarImgUrl, setAvatarImgUrl] = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      const decoded = jwtDecode(jwt);
      const username = decoded.iss;

      httpService.fetchNodes(`/api/secure/profile/user-profile/${username}`).then((response) => {
        setLoading(false)
        setProfileData(response)
        console.log(response);

        //@ts-ignore
        httpService.getS3Object('atlas-of-us-general-bucket', response.nodeRoot.Props.avatar).then(imgBlob => {
          setAvatarImgUrl(URL.createObjectURL(imgBlob));
        })
      });
    }
  }, []);

  return (
    <>
      <NavBar/>
      <div className="in-nav-container">
        {loading && 
          <p>loading</p>
        }
        {profileData && avatarImgUrl &&
          <>
            <p>data</p>
            <img src={avatarImgUrl} alt="Avatar" />
          </>
        }
      </div>
    </>
  );
}
