import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { useSession } from '../auth/api';
import { RequireLogin } from '../auth/require-login';
import { navigate, usePath } from '../router';
import { Footer } from '../shared_components/footer';
import { Nav } from '../shared_components/nav';
import { getEmail, listEmails, replyToEmail, type Contact, type Email, type EmailSummary } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { Dots, Thinking } from '../shared_components/thinking';

const EMAIL_PATH = '/admin/emails/';

//the /admin pages, only for a Person with admin: true. /admin is the inbox, /admin/emails/{id} opens one email.
//The api checks admin on every call too, this just keeps everyone else from seeing an empty shell
export default function Admin() {
  const session = useSession();
  const path = usePath();
  const emailId = path.startsWith(EMAIL_PATH) ? decodeURIComponent(path.slice(EMAIL_PATH.length)) || undefined : undefined;

  if (session.status === 'checking') return <Shell>
      <Thinking label="Checking who you are" />
    </Shell>;
  if (session.status === 'anonymous') {
    return (
      <RequireLogin reason="The admin pages need you to log in.">
        <Shell>{null}</Shell>
      </RequireLogin>
    );
  }
  if (!session.person.admin) return <Shell>This page is only for admins.</Shell>;
  return <Inbox emailId={emailId} />;
}

/* ---------------------------------------------------------------------------------------------
 * inbox: every email sent to @atlas-of-us.com, newest first, with the open one beside the list
 * ------------------------------------------------------------------------------------------- */

function Inbox({ emailId }: { emailId?: string }) {
  const [emails, setEmails] = useState<EmailSummary[]>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(true);
  const [version, setVersion] = useState(0); //bumped by the refresh button

  useEffect(() => {
    listEmails()
      .then(setEmails, (e) => setError(message(e)))
      .finally(() => setRefreshing(false));
  }, [version]);

  const refresh = () => {
    setRefreshing(true);
    setError(undefined);
    setVersion((v) => v + 1);
  };

  //a reply marks it replied in the list without reloading everything
  const onReplied = (id: string) => setEmails((list) => list?.map((e) => (e.id === id ? { ...e, replied: true } : e)));

  return (
    <Shell
      actions={
        <button className="comic-lift" style={styles.small} disabled={refreshing} onClick={refresh}>
          {refreshing ? <>Checking<Dots /></> : 'Refresh'}
        </button>
      }
    >
      {error && <AtlasError message={error} />}
      <div style={styles.columns}>
        <section style={styles.listPanel} className="comic-panel" aria-label="Inbox">
          <h2 style={styles.panelTitle}>Inbox {emails && <span style={styles.count}>{emails.length}</span>}</h2>
          {!emails && !error && <Thinking label="Opening the mailbag" style={styles.muted} />}
          {emails?.length === 0 && <p style={styles.muted}>No emails yet.</p>}
          <ul style={styles.list}>
            {emails?.map((e) => (
              <li key={e.id}>
                <button
                  style={{ ...styles.row, ...(e.id === emailId ? styles.rowOpen : {}) }}
                  aria-current={e.id === emailId}
                  onClick={() => navigate(`${EMAIL_PATH}${e.id}`)}
                >
                  <span style={styles.rowTop}>
                    <strong style={styles.rowFrom}>{e.from ? e.from.name || e.from.address : 'Unknown sender'}</strong>
                    <span style={styles.rowDate}>{shortDate(e.received_at)}</span>
                  </span>
                  <span style={styles.rowSubject}>
                    {e.replied && <span className="comic-chip" style={styles.repliedChip}>Replied</span>}
                    {e.subject}
                  </span>
                  <span style={styles.rowPreview}>{e.preview}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section style={styles.detailPanel} className="comic-panel" aria-label="Email">
          {emailId ? (
            <EmailView key={emailId} id={emailId} onReplied={() => onReplied(emailId)} />
          ) : (
            <p style={styles.muted}>Pick an email to read it.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}

function EmailView({ id, onReplied }: { id: string; onReplied: () => void }) {
  const [email, setEmail] = useState<Email>();
  const [error, setError] = useState<string>();
  const [showHtml, setShowHtml] = useState(false);

  useEffect(() => {
    getEmail(id).then(setEmail, (e) => setError(message(e)));
  }, [id]);

  if (error) return <AtlasError message={error} />;
  if (!email) return <Thinking label="Unfolding the letter" style={styles.muted} />;

  const flagged = [
    email.spam_verdict && email.spam_verdict !== 'PASS' && `Spam check: ${email.spam_verdict}`,
    email.virus_verdict && email.virus_verdict !== 'PASS' && `Virus check: ${email.virus_verdict}`,
  ].filter(Boolean);

  return (
    <article style={styles.email}>
      <h2 style={styles.subject}>{email.subject}</h2>
      {flagged.length > 0 && (
        <p role="alert" style={styles.error}>
          {flagged.join(' · ')}. Be careful with links and attachments.
        </p>
      )}
      <dl style={styles.meta}>
        <Meta label="From">{email.from ? contact(email.from) : 'Unknown'}</Meta>
        {email.reply_to && <Meta label="Reply to">{contact(email.reply_to)}</Meta>}
        <Meta label="To">{email.to.map(contact).join(', ')}</Meta>
        {email.cc.length > 0 && <Meta label="Cc">{email.cc.map(contact).join(', ')}</Meta>}
        <Meta label="Received">{longDate(email.received_at)}</Meta>
      </dl>

      {email.html && (
        <div style={styles.tabs}>
          <button className="comic-chip comic-lift" style={!showHtml ? styles.tabOn : styles.tab} onClick={() => setShowHtml(false)}>
            Text
          </button>
          <button className="comic-chip comic-lift" style={showHtml ? styles.tabOn : styles.tab} onClick={() => setShowHtml(true)}>
            Formatted
          </button>
        </div>
      )}
      {showHtml && email.html ? (
        //sandboxed with no permissions (no scripts, no same origin) and a CSP that blocks remote loads like tracking pixels
        <iframe title="Formatted email" sandbox="" style={styles.html} srcDoc={`${HTML_CSP}${email.html}`} />
      ) : (
        <div style={styles.body}>{email.text?.trim() || '(This email has no text.)'}</div>
      )}

      {email.attachments.length > 0 && (
        <div style={styles.attachments}>
          <span style={styles.label}>Attachments</span>
          {email.attachments.map((a, i) => (
            <span key={i} className="comic-chip">
              {a.name} · {size(a.size)}
            </span>
          ))}
        </div>
      )}

      {email.replies.map((r, i) => (
        <div key={i} style={styles.reply}>
          <span style={styles.replyMeta}>
            @{r.sent_by} replied from {r.from} · {longDate(r.sent_at)}
          </span>
          <div style={styles.body}>{r.body}</div>
        </div>
      ))}

      <ReplyForm
        to={(email.reply_to ?? email.from)?.address}
        onSend={async (body) => {
          const reply = await replyToEmail(id, body);
          setEmail((e) => e && { ...e, replies: [...e.replies, reply] });
          onReplied();
        }}
      />
    </article>
  );
}

function ReplyForm({ to, onSend }: { to?: string; onSend: (body: string) => Promise<void> }) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  if (!to) return <p style={styles.muted}>This email has no address to reply to.</p>;

  const send = async () => {
    setSending(true);
    setError(undefined);
    try {
      await onSend(body);
      setBody('');
    } catch (e) {
      setError(message(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.replyForm}>
      <label style={styles.label} htmlFor="admin-reply">
        Reply to {to}
      </label>
      <textarea
        id="admin-reply"
        style={styles.input}
        rows={6}
        value={body}
        placeholder="Write your reply... their email is quoted underneath when it's sent."
        onChange={(e) => setBody(e.target.value)}
      />
      {error && <AtlasError message={error} />}
      <button
        className="comic-lift"
        style={{ ...styles.send, ...(body.trim() && !sending ? {} : styles.disabled) }}
        disabled={!body.trim() || sending}
        onClick={send}
      >
        {sending ? <>Sending<Dots /></> : 'Send reply ▶'}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------
 * pieces
 * ------------------------------------------------------------------------------------------- */

function Shell({ actions, children }: { actions?: ReactNode; children: ReactNode }) {
  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <header style={styles.header}>
        <h1 style={styles.title} className="comic-title">
          Admin
        </h1>
        <div style={styles.headerActions}>
          {actions}
        </div>
      </header>
      {typeof children === 'string' ? <p style={styles.notice}>{children}</p> : children}
      <Footer />
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={styles.metaRow}>
      <dt style={styles.metaLabel}>{label}</dt>
      <dd style={styles.metaValue}>{children}</dd>
    </div>
  );
}

const HTML_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: cid:; style-src 'unsafe-inline'">`;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const contact = (c: Contact) => (c.name ? `${c.name} <${c.address}>` : c.address);
const longDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

//today's emails show the time, older ones the date
function shortDate(iso: string) {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ---------------------------------------------------------------------------------------------
 * styles
 * ------------------------------------------------------------------------------------------- */

const gunmetal = 'var(--gunmetal-black)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const rounded = '14px 8px 16px 10px / 8px 16px 10px 14px';

const button: CSSProperties = {
  border: `3px solid ${gunmetal}`,
  borderRadius: rounded,
  boxShadow: `3px 4px 0 ${gunmetal}`,
  fontFamily: comic,
  letterSpacing: 1,
};

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100svh',
    padding: '28px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    maxWidth: 1280,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: {
    fontSize: 'clamp(44px, 8vw, 64px)',
  },
  headerActions: {
    display: 'flex',
    gap: 12,
  },
  small: { ...button, padding: '4px 14px', background: ivory, color: gunmetal, fontSize: 20 },
  notice: {
    fontSize: 24,
  },
  //side by side when there's room, the list on top on a phone
  columns: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'flex-start',
  },
  listPanel: {
    flex: '1 1 300px',
    minWidth: 0,
    padding: '18px 14px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)',
  } as CSSProperties,
  detailPanel: {
    flex: '2.5 1 460px',
    minWidth: 0,
    padding: '22px 26px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-cinnamon)',
  } as CSSProperties,
  panelTitle: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: 1.5,
    padding: '0 8px 8px',
  },
  count: {
    fontSize: 20,
    opacity: 0.6,
  },
  muted: {
    padding: '6px 8px',
    fontSize: 20,
    opacity: 0.65,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: '70svh',
    overflowY: 'auto',
  },
  row: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '8px 10px',
    textAlign: 'left',
    background: 'none',
    color: gunmetal,
    border: '2px solid transparent',
    borderRadius: rounded,
    cursor: 'pointer',
  },
  rowOpen: {
    background: 'var(--pale-blue)',
    borderColor: gunmetal,
  },
  rowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowFrom: {
    fontSize: 19,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowDate: {
    flexShrink: 0,
    fontSize: 15,
    opacity: 0.7,
  },
  rowSubject: {
    fontSize: 17,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  repliedChip: {
    marginRight: 6,
    fontSize: 12,
    background: 'var(--pale-blue)',
  },
  rowPreview: {
    fontSize: 15,
    opacity: 0.65,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  email: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  subject: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 34,
    letterSpacing: 1,
    lineHeight: 1.1,
    overflowWrap: 'anywhere',
  },
  meta: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 18,
  },
  metaRow: {
    display: 'flex',
    gap: 10,
  },
  metaLabel: {
    flexShrink: 0,
    width: 80,
    fontFamily: comic,
    letterSpacing: 0.5,
    opacity: 0.75,
  },
  metaValue: {
    margin: 0,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  tabs: {
    display: 'flex',
    gap: 10,
  },
  tab: { fontSize: 16, color: gunmetal },
  tabOn: { fontSize: 16, color: gunmetal, background: 'var(--pale-blue)' },
  body: {
    padding: '12px 16px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: rounded,
    fontSize: 19,
    lineHeight: 1.35,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    maxHeight: '50svh',
    overflowY: 'auto',
  },
  html: {
    width: '100%',
    height: '50svh',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: rounded,
  },
  attachments: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  reply: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingLeft: 18,
    borderLeft: `4px solid var(--air-force-blue)`,
  },
  replyMeta: {
    fontSize: 16,
    opacity: 0.75,
  },
  replyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 6,
  },
  input: {
    fontSize: 19,
    padding: '8px 12px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: rounded,
    outlineColor: brownRed,
    resize: 'vertical',
  },
  send: { ...button, alignSelf: 'flex-end', padding: '4px 18px', background: brownRed, color: ivory, fontSize: 22 },
  disabled: {
    opacity: 0.5,
  },
  error: {
    padding: '6px 12px',
    background: 'var(--pale-red)',
    border: `3px solid ${brownRed}`,
    borderRadius: rounded,
    color: brownRed,
    fontSize: 18,
  },
};
