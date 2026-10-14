# For creating a new scene
When creating new scenes we will need to do several things.
1. Create a new folder and file in the atlas_of_us/application/ui/atlas-of-us-ui/src/personality path
2. Create a new script for the scene
3. Search for any relevant sounds that would work well for the scene. Sounds can be found in the Downloads foler
   - Play them through `createSoundscape` in `soundscape.ts` (looping beds plus one-shots), like the other scenes do
   - Encode them before committing: `scripts/encode-audio.sh bed <files>` for looping beds, `scripts/encode-audio.sh shot <files>` for one-shots
4. Pick the facets the scene and each prompt are designed to measure (the `facets` in the script). Don't add fixed trait scores for choices: every answer is scored by the llm from the choice and the user's reasoning
5. Add the scenario and its questions to atlas_of_us/application/database/personality_scenarios_seed.cypher
6. register the scene in personality.tsx, lazily with `lazy(() => import(...))` like the others so it gets its own chunk


Remember that we just want to focus on the build. Don't touch git or attempt to run any tests. You can check the ui and api compiles but thats it. Dont attempt to actually run any db inserts either. Keep changes as clean and tight as possible. We aim for brevity and readability over reusability.

That should be it! If there is anything else that needs done please ask.
