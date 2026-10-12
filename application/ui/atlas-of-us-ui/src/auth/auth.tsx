import { useId, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';

import { navigate } from '../router';
import { DatePicker } from '../shared_components/date-picker';
import { PhoneNumberInput } from '../shared_components/phone-number-input';
import { createUser, login } from './api';

/* ---------------------------------------------------------------------------------------------
 * pages
 * ------------------------------------------------------------------------------------------- */

//the /login and /create-account pages. ?next= is where to go once logged in
export function Auth({ mode }: { mode: 'login' | 'create' }) {
  const next = new URLSearchParams(window.location.search).get('next');
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/personality'; //never leave the site
  const onAuthenticated = () => navigate(safeNext);
  const onSwitch = () => navigate(`${mode === 'login' ? '/create-account' : '/login'}${window.location.search}`);

  return mode === 'login' ? (
    <Login onAuthenticated={onAuthenticated} onSwitch={onSwitch} />
  ) : (
    <CreateUser onAuthenticated={onAuthenticated} onSwitch={onSwitch} />
  );
}

interface PageProps {
  onAuthenticated: () => void;
  onSwitch: () => void;
}

function Login({ onAuthenticated, onSwitch }: PageProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const submit = useSubmit(() => login(phone, password).then(onAuthenticated));

  return (
    <Page title="Welcome back" error={submit.error}>
      <form style={styles.form} onSubmit={submit.run}>
        <Field label="Phone number" group>
          {(labelId) => <PhoneNumberInput value={phone} onChange={setPhone} labelId={labelId} />}
        </Field>
        <Field label="Password">
          <input style={styles.input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className="comic-lift" style={styles.submit} disabled={submit.busy}>
          {submit.busy ? 'Logging in...' : 'Log in ▶'}
        </button>
      </form>
      <p style={styles.switch}>
        New here?{' '}
        <button style={styles.link} onClick={onSwitch}>
          Create an account
        </button>
      </p>
    </Page>
  );
}

function CreateUser({ onAuthenticated, onSwitch }: PageProps) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', birthday: '', password: '', confirm: '' });
  const [phone, setPhone] = useState('');
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const mismatch = !passwordsMatch(form.password, form.confirm);

  const submit = useSubmit(async () => {
    if (mismatch) throw new Error("Those passwords don't match.");
    const { first_name, last_name, email, birthday, password } = form;
    await createUser({ first_name, last_name, phone, email, birthday, password });
    onAuthenticated();
  });

  return (
    <Page title="Join the Atlas" error={submit.error}>
      <form style={styles.form} onSubmit={submit.run}>
        <div style={styles.row}>
          <Field label="First name">
            <input style={styles.input} autoComplete="given-name" required value={form.first_name} onChange={set('first_name')} />
          </Field>
          <Field label="Last name">
            <input style={styles.input} autoComplete="family-name" required value={form.last_name} onChange={set('last_name')} />
          </Field>
        </div>
        <Field label="Phone number" hint="You'll log in with this" group>
          {(labelId) => <PhoneNumberInput value={phone} onChange={setPhone} labelId={labelId} />}
        </Field>
        <Field label="Email">
          <input style={styles.input} type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Birthday" group>
          {(labelId) => <DatePicker value={form.birthday} onChange={(birthday) => setForm((f) => ({ ...f, birthday }))} labelId={labelId} />}
        </Field>
        <div style={styles.row}>
          <Field label="Password" hint="At least 8 characters">
            <input style={styles.input} type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Confirm password" error={mismatch ? "Doesn't match yet" : undefined}>
            <input style={styles.input} type="password" autoComplete="new-password" required aria-invalid={mismatch} value={form.confirm} onChange={set('confirm')} />
          </Field>
        </div>
        <button className="comic-lift" style={styles.submit} disabled={submit.busy || mismatch}>
          {submit.busy ? 'Creating your account...' : 'Create account ▶'}
        </button>
      </form>
      <p style={styles.switch}>
        Already have an account?{' '}
        <button style={styles.link} onClick={onSwitch}>
          Log in
        </button>
      </p>
    </Page>
  );
}

//only complains once they've started typing the confirmation
function passwordsMatch(password: string, confirm: string) {
  return !confirm || password === confirm;
}

//runs a form submission, tracking whether it's in flight and the error message if it fails
function useSubmit(action: () => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false); //only on failure; on success this page unmounts
    }
  };
  return { busy, error, run };
}

function Page({ title, error, children }: { title: string; error?: string; children: ReactNode }) {
  return (
    <div style={styles.page} className="comic-page">
      <p style={styles.brand}>The Atlas Of Us</p>
      <main style={styles.card} className="comic-panel comic-pop">
        <h1 style={styles.title} className="comic-title">
          {title}
        </h1>
        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}

type FieldProps = { label: string; hint?: string; error?: string } & (
  | { group?: false; children: ReactNode }
  //several controls under one label (a <label> can only hold one), labelled by id instead
  | { group: true; children: (labelId: string) => ReactNode }
);

function Field({ label, hint, error, group, children }: FieldProps) {
  const labelId = useId();
  const footer = error ? <span style={styles.fieldError}>{error}</span> : hint && <span style={styles.hint}>{hint}</span>;

  return group ? (
    <div style={styles.field}>
      <span id={labelId} style={styles.label}>
        {label}
      </span>
      {children(labelId)}
      {footer}
    </div>
  ) : (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
      {footer}
    </label>
  );
}

/* ---------------------------------------------------------------------------------------------
 * styles
 * ------------------------------------------------------------------------------------------- */

const gunmetal = 'var(--gunmetal-black)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const rounded = '14px 8px 16px 10px / 8px 16px 10px 14px';

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100svh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '40px 16px',
  },
  brand: {
    fontFamily: comic,
    fontSize: 26,
    letterSpacing: 1.5,
    color: 'var(--air-force-blue)',
  },
  card: {
    width: 'min(520px, 100%)',
    padding: '28px 30px 22px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)',
    '--tilt': '-0.5deg',
  } as CSSProperties,
  title: {
    fontSize: 'clamp(40px, 9vw, 56px)',
    marginBottom: 18,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    minWidth: 0,
    padding: '8px 12px',
    fontSize: 20,
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: rounded,
    outlineColor: brownRed,
  },
  hint: {
    fontSize: 15,
    opacity: 0.65,
  },
  fieldError: {
    fontSize: 15,
    color: brownRed,
  },
  error: {
    marginBottom: 14,
    padding: '8px 12px',
    background: 'var(--pale-red)',
    border: `3px solid ${brownRed}`,
    borderRadius: rounded,
    color: brownRed,
    fontSize: 18,
  },
  submit: {
    marginTop: 6,
    padding: '6px 18px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: rounded,
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 26,
    letterSpacing: 1.5,
  },
  switch: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 18,
  },
  link: {
    padding: 0,
    background: 'none',
    border: 'none',
    color: brownRed,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};
