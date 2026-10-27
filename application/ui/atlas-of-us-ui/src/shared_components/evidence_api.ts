import { request } from '../auth/api';

//evidence: notes and files a person gives about something. A module serves the routes to add it under its own base
//path (e.g. /topics/<id>/evidence), and removing and downloading a piece live under /evidence

//a note, or a file someone gave as evidence
export interface Evidence {
  id: string;
  kind: 'note' | 'file';
  text: string | null; //a note's
  file_name: string | null; //a file's, with its content_type and size in bytes
  content_type: string | null;
  size: number | null;
  created_at: string;
}

//the kinds of file evidence can be, for the file picker, and the limits. The api checks them too
export const EVIDENCE_FILE_TYPES = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.docx';
export const MAX_EVIDENCE_MB = 20;
export const MAX_EVIDENCE = 5; //pieces about one thing

//browsers leave some files' type empty, so it's worked out from the name
const fileType = (file: File) => file.type || (file.name.toLowerCase().endsWith('.md') ? 'text/markdown' : 'text/plain');

//the calls that add the logged in user's evidence about one thing, served under `base` (e.g. /topics/<id>)
export function evidenceApi(base: string) {
  return {
    addNote: (text: string) => request<Evidence>('POST', `${base}/evidence`, { text }),
    //sends a file straight to the evidence bucket through a url the api presigns, then adds it as evidence
    uploadFile: async (file: File): Promise<Evidence> => {
      const contentType = fileType(file);
      const { upload_id, url } = await request<{ upload_id: string; url: string }>('POST', `${base}/evidence/uploads`, {
        file_name: file.name,
        content_type: contentType,
        size: file.size,
      });
      const sent = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file }).catch(() => undefined);
      if (!sent?.ok) throw new Error("I couldn't send your file. Try again?");
      return request<Evidence>('POST', `${base}/evidence/files`, { upload_id, file_name: file.name });
    },
  };
}

export type EvidenceApi = ReturnType<typeof evidenceApi>;

export const removeEvidence = (evidenceId: string) => request<void>('DELETE', `/evidence/${encodeURIComponent(evidenceId)}`);

//a short-lived url that downloads a file of evidence
export const fileUrl = (evidenceId: string) => request<{ url: string }>('GET', `/evidence/${encodeURIComponent(evidenceId)}/file`);
