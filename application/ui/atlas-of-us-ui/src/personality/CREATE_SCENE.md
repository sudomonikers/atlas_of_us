# For creating a new scene
Every scene is written to a set of IPIP-NEO items (see `README.md`). When creating a new scene we will need to do several things.
1. Find the scene's items in `scene_grouping.md`: which items it tests, its mode (story, live or interview) and its beats. The items' full wording is in `ipip_neo_items.md`
2. Create a new folder and file in the atlas_of_us/application/ui/atlas-of-us-ui/src/personality path
3. Write the script for the scene:
   - Turn each item into a moment where the player can show the behaviour it describes, without being asked to describe themselves. Never put the item's wording in a prompt
   - Make both ends look reasonable, so there's no right answer to give
   - One prompt can test several items. Its `facets` are the facets of the items it tests. Don't add fixed trait scores for choices: every answer is scored by the llm from the choice and the user's reasoning
   - End with a real-life question about the player's own life, with any frequency pinned down ("on how many of the last 7 days", not "often")
4. Search for any relevant sounds that would work well for the scene. Sounds can be found in the Downloads foler
   - Play them through `createSoundscape` in `soundscape.ts` (looping beds plus one-shots), like the other scenes do
   - Encode them before committing: `scripts/encode-audio.sh bed <files>` for looping beds, `scripts/encode-audio.sh shot <files>` for one-shots
5. Add the scenario and its questions to atlas_of_us/application/database/personality_scenarios_seed.cypher, with its `order` from `scene_grouping.md` and `real_life: true` on the real-life question
6. Register the scene in personality.tsx: add it to `SCENARIOS` in play order, and to `PLAYABLE` lazily with `lazy(() => import(...))` like the others so it gets its own chunk
7. Add the scene to the regression harness in `testing/`:
   - add it to `SCENES` in `regression.mjs`, in play order
   - give every persona in `testing/personas/` an answer to every prompt on the path its choices take, written in character and in line with its targets (one-liners stay one-liners)
   - run `node src/personality/testing/regression.mjs --check` from the ui folder. It only checks every prompt on each path has an answer and every answer is used; it doesn't play anything


Remember that we just want to focus on the build. Don't touch git or attempt to run any tests. You can check the ui and api compiles but thats it. Dont attempt to actually run any db inserts either. Keep changes as clean and tight as possible. We aim for brevity and readability over reusability.

That should be it! If there is anything else that needs done please ask.
