import "./home.css";
import { NavBar } from "../../common-components/navbar/nav";
import { useGlobal } from "../../GlobalProvider";
import { useNavigate } from "react-router";

export function Home() {
    const { loggedIn } = useGlobal();
    const navigate = useNavigate();
    
    const handleLogin = () => {
        navigate('/Login');
    }
    
    const handleSignup = () => {
        navigate('/Signup');
    }
    
    const handleStartJourney = () => {
        // Navigate to profile creation/assessment
        navigate('/Profile');
    }
    
    const handleExploreGraph = () => {
        navigate('/Graph');
    }

    return (
        <>
            <NavBar />
            <div className="home-container">
                <header className="hero-section">
                    <h1 className="hero-title">Atlas Of Us</h1>
                    <p className="hero-subtitle">A place for individuals to better themselves</p>
                </header>

                <section className="intro-section">
                    <h2>Transform Yourself in 3 Steps</h2>
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Discover Who You Are</h3>
                            <p>Get a clear, honest depiction of your current self through our comprehensive assessment framework.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Visualize Your Future</h3>
                            <p>Explore the graph of possibilities to discover who you want to become and set meaningful goals.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Chart Your Path</h3>
                            <p>Create a personalized roadmap with actionable steps to bridge the gap between who you are and who you want to be.</p>
                        </div>
                    </div>
                </section>

                <section className="action-section">
                    {loggedIn ? (
                        <div className="returning-user">
                            <h2>Welcome Back!</h2>
                            <p>Continue your journey of self-improvement</p>
                            <div className="action-buttons">
                                <button className="btn btn-primary" onClick={handleStartJourney}>
                                    Continue Assessment
                                </button>
                                <button className="btn btn-secondary" onClick={handleExploreGraph}>
                                    Explore Graph
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="new-user">
                            <h2>Ready to Begin?</h2>
                            <p>Start your journey of self-discovery and growth</p>
                            <div className="action-buttons">
                                <button className="btn btn-primary" onClick={handleSignup}>
                                    Start Your Journey
                                </button>
                                <button className="btn btn-secondary" onClick={handleLogin}>
                                    Already a Member? Login
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section className="learn-more">
                    <h3>What is the Atlas of Us?</h3>
                    <p>The Atlas of Us is a comprehensive platform designed to guide you through the process of self-improvement. 
                       We believe that meaningful change starts with understanding yourself, envisioning your goals, and taking 
                       deliberate steps toward becoming the person you want to be.</p>
                </section>
            </div>
        </>
    );
}