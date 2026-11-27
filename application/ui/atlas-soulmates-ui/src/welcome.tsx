import Login from './login';

//signed out: what this is, and logging in with an Atlas account
export default function Welcome() {
  return (
    <div className="page welcome">
      <section className="hero">
        <h1>
          No swiping.
          <br />
          <em>Just your person.</em>
        </h1>
        <p className="lead">
          The Atlas knows who you really are: your personality, your values, the life you live. We use all of it to find
          the one person who fits you, and introduce you.
        </p>
      </section>
      <Login />
    </div>
  );
}
