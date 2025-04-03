import { useEffect, useState } from "react";
import { NavBar } from "../../common-components/navbar/nav";
import { HttpService } from "../../services/http-service";
import { jwtDecode } from "jwt-decode";

export function Profile() {
  const httpService = new HttpService();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      const decoded = jwtDecode(jwt);
      const username = decoded.iss;

      httpService.fetchNodes(`/api/secure/profile/user-profile/${username}`).then((response) => {
        setLoading(false)
        setProfileData(response)
        console.log(response)
      });
    }
  }, [])

  return (
    <>
      <NavBar/>
      <div className="in-nav-container">
        {loading && 
          <p>loading</p>
        }
        {profileData &&
          <p>data</p>
        }
      </div>
    </>
  );
}
