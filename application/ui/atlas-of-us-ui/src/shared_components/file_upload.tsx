import { useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { AtlasError } from './atlas-error';
import { Dots } from './thinking';

const gunmetal = 'var(--gunmetal-black)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

interface FileUploadProps {
  onUpload: (file: File) => Promise<unknown>; //sends the file. A failure's message is shown under it
  label?: string; //the button's
  accept?: string; //for the file picker, e.g. ".pdf,.png"
  maxMb?: number; //bigger files are turned away before onUpload
  hint?: string; //what can be uploaded, shown beside the button
  disabled?: boolean;
}

//a dashed drop zone with a button to pick a file, that sends one file at a time and shows how it went
export function FileUpload({ onUpload, label = 'Attach a file', accept, maxMb, hint, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [over, setOver] = useState(false); //a file is being dragged over it
  const [error, setError] = useState<string>();
  const picker = useRef<HTMLInputElement>(null);
  const off = disabled || uploading;

  const upload = (file: File | undefined) => {
    if (picker.current) picker.current.value = ''; //so the same file can be picked again after a failure
    if (!file || off) return;
    if (maxMb && file.size > maxMb * 1024 * 1024) {
      setError(`Files can be up to ${maxMb} MB.`);
      return;
    }
    setUploading(true);
    setError(undefined);
    onUpload(file)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setUploading(false));
  };
  const drag = (e: DragEvent, entering: boolean) => {
    e.preventDefault();
    setOver(entering && !off);
  };

  return (
    <div style={styles.wrap}>
      <div
        style={{ ...styles.zone, ...(over ? styles.zoneOver : {}), ...(off ? styles.disabled : {}) }}
        onDragOver={(e) => drag(e, true)}
        onDragLeave={(e) => drag(e, false)}
        onDrop={(e) => {
          drag(e, false);
          upload(e.dataTransfer.files[0]);
        }}
      >
        <button className="comic-lift" style={styles.button} disabled={off} onClick={() => picker.current?.click()}>
          {uploading ? <>Uploading<Dots /></> : label}
        </button>
        <span style={styles.hint}>{hint ? `${hint}, or drop it here` : 'or drop it here'}</span>
        <input ref={picker} type="file" accept={accept} hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      {error && <AtlasError message={error} size={36} />}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  zone: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 12px',
    padding: '10px 12px',
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    transition: 'background 120ms',
  },
  zoneOver: {
    background: 'var(--pale-blue)',
  },
  button: {
    padding: '3px 14px',
    background: 'var(--ivory-white)',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: 'var(--font-comic)',
    fontSize: 18,
    letterSpacing: 1,
  },
  hint: {
    fontSize: 14,
    color: 'var(--air-force-blue)',
  },
  disabled: {
    opacity: 0.5,
  },
};
