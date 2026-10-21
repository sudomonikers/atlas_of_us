import { useState, type CSSProperties } from 'react';
import { request } from '../auth/api';
import { AtlasError } from '../shared_components/atlas-error';

//a button that opens a popup where the user tells us what they want. The page they were on goes along with it
export function Feedback({ buttonStyle }: { buttonStyle: CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  const close = () => {
    setOpen(false);
    setSent(false);
    setError(undefined);
  };

  const submit = async () => {
    setSending(true);
    setError(undefined);
    try {
      await request('POST', '/feedback', { description, url: window.location.href });
      setDescription('');
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className="comic-lift" style={buttonStyle} onClick={() => setOpen(true)}>
        Feedback
      </button>

      {open && (
        <div style={styles.backdrop} onClick={close} onKeyDown={(e) => e.key === 'Escape' && close()}>
          <div style={styles.box} className="comic-panel comic-pop" role="dialog" aria-label="Feedback" onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.title}>Feedback</h2>
            {sent ? (
              <p style={styles.text}>Got it. Andrew reads every single one of these, so choose your words wisely.</p>
            ) : (
              <>
                <p style={styles.text}>Got a wish, a gripe or a bug? Lay it on me.</p>
                <textarea
                  autoFocus
                  style={styles.input}
                  rows={6}
                  value={description}
                  placeholder="Tell me what you want, what you really really want..."
                  onChange={(e) => setDescription(e.target.value)}
                />
                {error && <AtlasError message={error} />}
              </>
            )}
            <div style={styles.footer}>
              <button className="comic-lift" style={styles.cancel} onClick={close}>
                {sent ? 'Close' : 'Cancel'}
              </button>
              {!sent && (
                <button
                  className="comic-lift"
                  style={{ ...styles.send, ...(description.trim() && !sending ? {} : styles.disabled) }}
                  disabled={!description.trim() || sending}
                  onClick={submit}
                >
                  {sending ? 'Sending...' : 'Send ▶'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ink = 'var(--gunmetal-black)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    background: 'rgba(57, 61, 63, 0.55)',
  },
  box: {
    width: 'min(560px, 100%)',
    padding: '24px 30px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: 'var(--ivory-white)',
    borderRadius: 'var(--wobbly)',
    fontFamily: 'var(--font-hand)',
    '--panel-fill': 'var(--pale-blue)',
  } as CSSProperties,
  title: {
    fontFamily: 'var(--font-comic)',
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1.5,
  },
  text: {
    fontSize: 22,
  },
  input: {
    fontSize: 20,
    padding: '8px 12px',
    background: '#fff',
    color: ink,
    border: `3px solid ${ink}`,
    borderRadius: corners,
    outlineColor: 'var(--brown-red)',
    resize: 'vertical',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancel: {
    padding: '4px 18px',
    background: 'var(--ivory-white)',
    color: ink,
    border: `3px solid ${ink}`,
    borderRadius: corners,
    boxShadow: `3px 4px 0 ${ink}`,
    fontFamily: 'var(--font-comic)',
    fontSize: 20,
    letterSpacing: 1,
  },
  send: {
    padding: '4px 18px',
    background: 'var(--brown-red)',
    color: 'var(--ivory-white)',
    border: `3px solid ${ink}`,
    borderRadius: corners,
    boxShadow: `3px 4px 0 ${ink}`,
    fontFamily: 'var(--font-comic)',
    fontSize: 20,
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.5,
  },
};
