# Contributing

Thank you for wanting to make the calendar even better :-)

## Reporting an issue
You can address a problem by using the integrated issue tracking system on [Github](https://github.com/zabuto/calendar/issues).

1. Make sure the problem you want to report can be reproduced in the latest version.
2. Use https://jsfiddle.net or https://jsbin.com to provide a test page.
3. Indicate what browsers the issue can be reproduced in. _Note; IE compatibilty issues will not be taken into consideration._


## Contributing code

Here are a few guidelines to help your contribution find it's way into the project.

### Important notes
Please don't edit files in the `dist` subdirectory as they are generated via Grunt. You'll find source code in the `src` subdirectory.

#### Code style
Regarding code style like indentation and whitespace, follow the [jQuery style guide](http://contribute.jquery.com/style-guides/js). This repository contains an [.editorconfig](http://editorconfig.org/) file for your convenience.

#### Unit testing
While Grunt can run the included unit tests via [PhantomJS](http://phantomjs.org/), this shouldn't be considered a substitute for the real thing. Please be sure to test the `test/*.html` unit test file(s) in _actual_ browsers.

### Modifying the code
First, ensure that you have the latest [Node.js](http://nodejs.org/) and [npm](http://npmjs.org/) installed.

Test that Grunt's CLI is installed by running `grunt --version`.  If the command isn't found, run `npm install -g grunt-cli`.  For more information about installing Grunt, see the [getting started guide](http://gruntjs.com/getting-started).

1. Fork and clone the repo.
1. Run `npm install` to install all dependencies (including Grunt).
1. Run `grunt` to grunt this project.

Assuming that you don't see any red, you're ready to go. Just be sure to run `grunt` after making any changes, to ensure that nothing is broken.


### Submitting pull requests

1. If you are addressing a problem, please report it as an issue (see above).
2. Create a new branch, please don't work in your master branch directly.
3. Fix stuff.
4. Add or update tests along with your patch. Run `grunt` to see the tests fail. Also run the `test/*.html` file(s) in at least one actual browser.
5. Describe the change in your pull request and reference the issue number, like this: "Fixed bug for navigation to next month. Fixes #319". If you're adding a new localization file, use something like: "Localization: added Dutch (nl) language".
6. Push to your fork and submit a pull request.
