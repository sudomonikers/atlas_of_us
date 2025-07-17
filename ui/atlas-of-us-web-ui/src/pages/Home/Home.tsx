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
        navigate('/Assessment');
    }
    
    const handleExploreGraph = () => {
        navigate('/Graph');
    }

    return (
        <>
            <NavBar />
            <div className="home-container">
                <header className="hero-section">
                    <h1 className="hero-title text-h1">Atlas Of Us</h1>
                    <p className="hero-subtitle text-body-large">A place for individuals to better themselves</p>
                </header>

                <section className="intro-section">
                    <h2 className="text-h2 text-center">Transform Yourself in 3 Steps</h2>
                    <div className="steps-container grid-cosmic">
                        <div className="step card-cosmic interactive-particle">
                            <div className="step-number">1</div>
                            <h3 className="text-h3">Discover Who You Are</h3>
                            <p className="text-body">Get a clear, honest depiction of your current self through our comprehensive assessment framework.</p>
                        </div>
                        <div className="step card-cosmic interactive-particle">
                            <div className="step-number">2</div>
                            <h3 className="text-h3">Visualize Your Future</h3>
                            <p className="text-body">Explore the graph of possibilities to discover who you want to become and set meaningful goals.</p>
                        </div>
                        <div className="step card-cosmic interactive-particle">
                            <div className="step-number">3</div>
                            <h3 className="text-h3">Chart Your Path</h3>
                            <p className="text-body">Create a personalized roadmap with actionable steps to bridge the gap between who you are and who you want to be.</p>
                        </div>
                    </div>
                </section>

                <section className="action-section">
                    {loggedIn ? (
                        <div className="returning-user card-cosmic text-center">
                            <h2 className="text-h2">Welcome Back!</h2>
                            <p className="text-body-large">Continue your journey of self-improvement</p>
                            <div className="action-buttons flex-center gap-md mt-lg">
                                <button className="btn-cosmic interactive-particle" onClick={handleStartJourney}>
                                    Continue Assessment
                                </button>
                                <button className="btn-glass interactive-particle" onClick={handleExploreGraph}>
                                    Explore Graph
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="new-user card-cosmic text-center">
                            <h2 className="text-h2">Ready to Begin?</h2>
                            <p className="text-body-large">Start your journey of self-discovery and growth</p>
                            <div className="action-buttons flex-center gap-md mt-lg">
                                <button className="btn-cosmic interactive-particle" onClick={handleSignup}>
                                    Start Your Journey
                                </button>
                                <button className="btn-glass interactive-particle" onClick={handleLogin}>
                                    Already a Member? Login
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section className="learn-more card-cosmic text-center">
                    <h3 className="text-h3">What is the Atlas of Us?</h3>
                    <p className="text-body">The Atlas of Us is a comprehensive platform designed to guide you through the process of self-improvement. 
                       We believe that meaningful change starts with understanding yourself, envisioning your goals, and taking 
                       deliberate steps toward becoming the person you want to be.</p>
                </section>
            </div>
        </>
    );
}