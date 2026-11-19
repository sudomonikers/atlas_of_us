import { useState, type FormEvent } from 'react';
import { ATLAS, login } from './api';
import { COUNTRIES, typedPhone } from './countries';

//signing in with an Atlas account: the same phone and password as on atlas-of-us.com
export default function Login() {
  const [iso, setIso] = useState('US');
  const [phone, setPhone] = useState(''); //the number without its country code, as shown
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(e164(iso, phone), password);
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
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <div className="phone">
          <select aria-label="Country code" value={iso} onChange={(e) => setIso(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name} +{c.code}
              </option>
            ))}
          </select>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              const next = typedPhone(iso, phone, e.target.value);
              setIso(next.iso);
              setPhone(next.number);
            }}
            required
          />
        </div>
      </div>
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

//the number in E.164, as accounts are kept: + then the country code and the number's digits
function e164(iso: string, phone: string) {
  const code = COUNTRIES.find((c) => c.iso === iso)?.code ?? '1';
  return `+${code}${phone.replace(/\D/g, '')}`;
}
