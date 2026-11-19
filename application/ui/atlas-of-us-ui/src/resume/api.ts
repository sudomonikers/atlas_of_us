import { request } from '../auth/api';

//importing a resume: the PDF goes straight to the evidence bucket, Atlas reads it for a credit, and the person changes
//and confirms the skills, knowledge and achievements it found

//a skill or topic the resume shows, at the level it shows
export interface Found {
  index: number; //which one it is, for confirming
  kind: 'skill' | 'topic';
  name: string;
  description: string;
  rank: number; //Dreyfus 1 (Novice) to 5 (Expert), or Bloom 1 (Remember) to 6 (Create)
  evidence: string; //what in the resume shows it
  id: string | null; //the skill or topic it is, or null for one Atlas doesn't have yet
  existing_name: string | null;
  current_rank: number | null; //the level they're at in it already
}

//something noteworthy the resume shows they did, such as an award, a certification or a result they can point to
export interface Achievement {
  index: number; //which one it is, for confirming
  title: string;
  description: string;
  year: number | null;
  shows: number[]; //the indexes of the skills and topics it shows, in found
  on_profile: boolean; //whether they have it already
}

//what earlier resumes added that this one doesn't show. It all stays on their profile
export interface NotOnThisResume {
  skills_and_topics: { id: string; name: string; kind: 'skill' | 'topic' }[];
  achievements: string[]; //their titles
}

export interface Import {
  status: 'none' | 'reading' | 'ready' | 'failed';
  file_name: string | null;
  found: Found[];
  achievements: Achievement[];
  not_on_this_resume: NotOnThisResume;
}

//what confirming added
export interface Added {
  skills: number;
  topics: number;
  achievements: number;
}

export const MAX_RESUME_MB = 20;

export const getImport = () => request<Import>('GET', '/resume');

//sends the resume straight to the evidence bucket through a url the api presigns, then asks for it to be read
export const importResume = async (file: File): Promise<Import> => {
  const { upload_id, url } = await request<{ upload_id: string; url: string }>('POST', '/resume/uploads', { size: file.size });
  const sent = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: file }).catch(() => undefined);
  if (!sent?.ok) throw new Error("I couldn't send your resume. Try again?");
  return request<Import>('POST', '/resume/read', { upload_id, file_name: file.name });
};

//adds what they chose, at the levels they chose, and the achievements they kept. An achievement is added with the
//skills and topics it shows that they added
export const confirmImport = (chosen: { index: number; rank: number }[], achievements: number[]) =>
  request<Added>('POST', '/resume/confirm', { chosen, achievements });

export const discardImport = () => request<void>('DELETE', '/resume');
