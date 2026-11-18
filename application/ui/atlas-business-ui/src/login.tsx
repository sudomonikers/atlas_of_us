import { useState, type FormEvent } from 'react';
import { ATLAS, login } from './api';

//signing in with an Atlas account: the same phone and password as on atlas-of-us.com
export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(phone, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card login" onSubmit={submit}>
      <h2>Log in to see the work you're closest to</h2>
      <p className="muted">Use your Atlas Of Us account. Your skills, knowledge, abilities and personality come with it.</p>
      <label className="field">
        <span>Phone</span>
        <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button" type="submit" disabled={busy}>
        {busy ? 'Logging in...' : 'Log in'}
      </button>
      <p className="muted small">
        No account yet? <a href={`${ATLAS}/create-account`}>Make one on atlas-of-us.com</a>.
      </p>
    </form>
  );
}
