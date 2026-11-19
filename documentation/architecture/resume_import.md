# How Importing a Resume Works

A person uploads their resume as a PDF, and Atlas reads it for the skills and knowledge it shows, each at the level it
shows, and for the noteworthy things they achieved. The person sees everything it found, changes levels, leaves out
what isn't them, and adds the rest. Adding places them on each skill and topic, the resume becomes a piece of evidence
on each one, and each achievement they keep becomes an Achievement that demonstrates the skills and topics it shows.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/resume/` | The Your Resume page at `/resume`: the upload, the review and what was added. My Skills and My Knowledge link to it |
| API | `application/apis/atlas-api/src/resume/` | The upload url, asking for the read, the import's state, confirming and discarding |
| Job | `application/apis/atlas-jobs/src/jobs/resume_import.rs` | Reads the resume and finds which of what it shows the graph already has |
| Shared | `application/apis/atlas-shared/src/resume.rs` | What the job finds and the api shows |
| Storage | The evidence bucket (`infrastructure/evidence.tf`) | The resume, under the person's evidence |

## Reading it
1. The browser uploads the PDF straight to the evidence bucket through a url the api presigns, as with any file of
   evidence.
2. Asking for it to be read costs a credit (see `credits.md`). The api keeps the upload on the Person and queues the
   `resume_import` job.
3. The job sends the PDF to Sonnet, with the names of the skills, topics and achievements the person already has, so
   the same one keeps its name from one resume to the next. Sonnet which names the skills (each at a Dreyfus level) and the topics (each at a Bloom
   level) the resume shows, with what in the resume shows each, and only those the resume shows. The same naming rules as everywhere else apply: one
   skill or subject per name, the way a CV or a course titles it. It also names the achievements: awards,
   certifications, publications, patents, promotions and results they can point to, each with the skills and topics
   it shows. An achievement that shows none of them is left out.
   A resume says what someone did more than how well, so levels lean low: most skills are Competent or below and most
   topics Apply or below, and each level above takes clear evidence. The top level, Expert in a skill or Create in a
   topic, takes an achievement on the same resume that shows it. One without is a level lower, whatever the model
   chose.
4. Each name goes through its module's resolver, which finds the skill or topic it already is. A name the graph
   doesn't have goes through its module's gates, the same as asking for it in search: one they turn away as nonsense,
   or as a different kind of thing (a personality trait, an ability, or a skill named as a topic), is left out, with
   the achievements' links to it. A name the gates rename is resolved again under the new name. Nothing is created
   while reading: a name that passes and that the graph doesn't have is shown as new.
5. What it found is kept on the Person as one JSON property until they confirm or discard it. A read that fails gives
   the credit back, the way every premium feature does.

## Confirming it
The person sends back which of what was found they're adding, each with the level they chose.

- **A new one is made then,** through its resolver, the same as asking for it in search. Its levels are asked to be
  filled straight away.
- **Placing them** is the same as placing yourself on a skill or topic, at the level they chose. A skill or topic still
  being filled takes them at its level, and its descriptions arrive with the fill.
- **The resume is evidence** on each one, marked as coming from a resume. One file in the bucket is shared by every
  piece of evidence made from it, and it's deleted once no evidence refers to it. A skill or topic that already has as
  much evidence as it can hold is placed without it.
- **Achievements** they keep are each an `Achievement` the person `HAS_ACHIEVEMENT`, which `DEMONSTRATES` the skills
  and topics it shows that they added (see `documentation/data_model/achievements/achievements.md`). One whose skills
  and topics they all left out can't be kept. A person's achievements have different titles, so importing the same
  resume again adds to the ones they have.
- **Discarding** forgets what was found, and deletes the resume unless it's evidence.

## A newer resume
Every read costs a credit, and a new read replaces one that wasn't confirmed. Confirming or discarding ends the read.

- **The review** shows the levels they're at already: what this resume shows at their level or lower starts unticked.
  An achievement they have already, by its title in any case, is marked as on their profile and starts unticked.
- **Not on this resume** lists what earlier resumes added that this one doesn't show: the skills and topics an earlier
  resume is evidence about, and the achievements earlier resumes added. It's there for them to know. Everything on it
  stays on their profile.
- **The newest resume replaces the earlier ones** as the evidence about everything it shows, whether they add it
  again or not, so a skill or topic has one resume as evidence at most. What only an earlier resume shows keeps that
  one, and an earlier resume's file is deleted once nothing refers to it.
