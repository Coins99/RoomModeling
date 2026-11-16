# Contributing to RoomModeling

Use Node.js 18 or newer. Run `npm start` to open the editor and `npm test` to run the dependency-free suite. No install step is required.

## Make a change

1. Create a branch from the latest `main`.
2. Keep the change focused and preserve existing JSON save compatibility.
3. Run `npm test`. For model or persistence fixes, add a regression case using semantic documents.
4. For editor changes, check the affected controls in a browser and describe the steps and result in your pull request.
5. Open a pull request against `main` with the problem, resulting behavior and validation.

Start with [the architecture guide](docs/architecture.md). Keep unit conversion inside the model/render boundary, and validate imported documents before applying them.

## Report a bug

Include your browser, operating system, reproduction steps, expected behavior and actual behavior. For save/load problems, attach a small synthetic JSON example. Mention whether the problem also occurs with [the studio sample](examples/studio.json).
