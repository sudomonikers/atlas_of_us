# For creating a new scene
When creating new scenes we will need to do several things.
1. Create a new folder and file in the atlas_of_us/application/ui/atlas-of-us-ui/src/personality path
2. Create a new script for the scene
3. Search for any relevant sounds that would work well for the scene. Sounds can be found in the Downloads foler
4. Come up with personality trait mappings
5. Create the script database seed script in atlas_of_us/application/database (similar to atlas_of_us/application/database/personality_scenarios_seed.cypher)
6. register the scene in personality.tsx


Remember that we just want to focus on the build. Don't touch git or attempt to run any tests. You can check the ui and api compiles but thats it. Dont attempt to actually run any db inserts either. Keep changes as clean and tight as possible. We aim for brevity and readability over reusability.

That should be it! If there is anything else that needs done please ask.
