import "./assessment.css";
import { NavBar } from "../../common-components/navbar/nav";
import { useGlobal } from "../../GlobalProvider";
import { useNavigate } from "react-router";

export function Assessment() {
    const { loggedIn } = useGlobal();
    const navigate = useNavigate();

    return (
        <>
            <NavBar />
            
        </>
    );
}