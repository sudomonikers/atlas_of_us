import { useState, type CSSProperties } from 'react';
import { EVIDENCE_FILE_TYPES, MAX_EVIDENCE, MAX_EVIDENCE_MB, fileUrl, removeEvidence, type Evidence, type EvidenceApi } from './evidence_api';
import { AtlasError } from './atlas-error';
import { FileUpload } from './file_upload';
import { Dots } from './thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

const MAX_NOTE_CHARS = 2000;

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

//a file's size the way people read it
function readableSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

//a page drawn with a folded corner, for a file
function FileMark() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M2 1.5h8l4.5 4.5v12.5H2z" fill={ivory} stroke={gunmetal} strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 1.5V6h4.5" fill="none" stroke={gunmetal} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

//someone's evidence for where they are with something: notes as they wrote them, and files to download. With onRemoved, each can be removed
export function EvidenceList({ evidence, onRemoved }: { evidence: Evidence[]; onRemoved?: (id: string) => void }) {
  const [busy, setBusy] = useState<string>(); //the evidence being opened or removed
  const [error, setError] = useState<string>();
  if (!evidence.length) return null;

  const run = (id: string, action: () => Promise<void>) => {
    setBusy(id);
    setError(undefined);
    action().catch((e) => setError(errorText(e))).finally(() => setBusy(undefined));
  };
  //the url downloads the file, so the page stays where it is
  const open = (id: string) => run(id, () => fileUrl(id).then(({ url }) => window.location.assign(url)));
  const remove = (id: string) => run(id, () => removeEvidence(id).then(() => onRemoved?.(id)));

  return (
    <div style={styles.listWrap}>
      <ul style={styles.list}>
        {evidence.map((e) => (
          <li key={e.id} style={styles.item}>
            {e.kind === 'note' ? (
              <p style={styles.note}>{e.text}</p>
            ) : (
              <button className="comic-lift" style={styles.file} disabled={busy === e.id} onClick={() => open(e.id)}>
                <FileMark />
                <span style={styles.fileName}>{e.file_name}</span>
                <span style={styles.size}>{readableSize(e.size)}</span>
              </button>
            )}
            {onRemoved && (
              <button className="comic-lift" style={styles.remove} disabled={busy === e.id} onClick={() => remove(e.id)}>
                {busy === e.id ? <Dots /> : 'Remove'}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <AtlasError message={error} size={36} />}
    </div>
  );
}

//adds evidence for where the logged in user is with something: a note they write, or a file they pick. `given`
//is how many pieces they've given for it already, and once it's the most one takes, it says so instead
export function EvidenceForm({ api, given, onAdded }: { api: EvidenceApi; given: number; onAdded: (evidence: Evidence) => void }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  if (given >= MAX_EVIDENCE) {
    return <p style={styles.hint}>That's the most evidence one takes ({MAX_EVIDENCE} pieces). Remove one to add another.</p>;
  }

  const saveNote = () => {
    setSaving(true);
    setError(undefined);
    api.addNote(note)
      .then((added) => {
        onAdded(added);
        setNote('');
      })
      .catch((e) => setError(errorText(e)))
      .finally(() => setSaving(false));
  };

  return (
    <div style={styles.form}>
      <textarea
        style={styles.input}
        rows={3}
        maxLength={MAX_NOTE_CHARS}
        value={note}
        placeholder="Something you made, studied, taught or did that shows it"
        onChange={(e) => setNote(e.target.value)}
      />
      <div style={styles.actions}>
        <button
          className="comic-lift"
          style={{ ...styles.button, ...(note.trim() && !saving ? {} : styles.disabled) }}
          disabled={!note.trim() || saving}
          onClick={saveNote}
        >
          {saving ? <>Adding<Dots /></> : 'Add note'}
        </button>
      </div>
      {error && <AtlasError message={error} size={36} />}
      <FileUpload
        accept={EVIDENCE_FILE_TYPES}
        maxMb={MAX_EVIDENCE_MB}
        hint={`PDF, image, text or Word, up to ${MAX_EVIDENCE_MB} MB`}
        onUpload={(file) => api.uploadFile(file).then(onAdded)}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  listWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  note: {
    flex: 1,
    margin: 0,
    padding: '6px 12px',
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    fontSize: 16,
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  file: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `2px 2px 0 ${gunmetal}`,
    font: 'inherit',
    fontSize: 16,
    textAlign: 'left',
    cursor: 'pointer',
  },
  fileName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  size: {
    fontSize: 14,
    color: blue,
  },
  remove: {
    padding: '4px 10px',
    background: 'transparent',
    color: gunmetal,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    fontSize: 17,
    padding: '8px 12px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    outlineColor: 'var(--brown-red)',
    resize: 'vertical',
    font: 'inherit',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    padding: '3px 14px',
    background: cinnamon,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
  },
  hint: {
    fontSize: 14,
    color: blue,
  },
  disabled: {
    opacity: 0.5,
  },
};
