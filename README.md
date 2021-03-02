# Audioxide Review Dropbox

The review dropbox is a simple content editor which allows the multi-author reviews on [Audioxide](https://audioxide.com) to be added and edited by each individual author using a rich text editor.

The dropbox retrieves and uploads content to our YAML/Markdown format, with some basic formatting enforcement.

We use GitHub integration to manage user permissioning and data interactions, Svelte as a frontend framework and Quill as our rich text editor.

## Available Scripts

### yarn start

Runs the app in the development mode.
Open http://localhost:8080 to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### yarn test

Launches the test runner in the interactive watch mode.
See the section about running tests for more information.

### yarn build

Builds a static copy of your site to the `build/` folder.
Your app is ready to be deployed!

We use the standard [@snowpack/plugin-webpack](https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-webpack) bundler plugin for our production builds.
