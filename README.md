# VCR

## Running a comparison

This script requires chromedriver (Node implementation didn't work with
geckodriver at the time of writing), and thus does not support taking
screenshots of individual elements on a page.

Installing:

Requires node (v6 assumed) and npm

```
nvm use
npm install
```

Usage:

`node vcr-run.js [path-to-repo] [path-to-test-json] [ref-branch] [test-branch]`

where

- `path-to-repo`: path to the repo of the project to be tested
- `path-to-test-json`: path to JSON describing the tests to run (see below)
- `ref-branch`: branch name (or SHA) of the commit to use as a reference
- `test-branch` branch name (or SHA) of the commit to be tested

The script will checkout the reference branch, run through all the testcases in
the JSON and save the resulting screenshots in a newly-created directory in the
`screenshots` directory named after the SHA of the commit. For caching
purposes, the run will be skipped if the directory already exists. This is then
repeated for the test branch.

Finally, a report is generated (based on the `template.njk` Nunjucks template)
and saved in the file `vcr-results.html`.

### Test JSON format

The JSON must be an object whose keys are strings giving the name of each test
case.

The value for each key must be an object with two properties:

- `url`: the URL of the page to open before screenshotting
- `selector`: CSS selector describing the element to screenshot, or `null` to
  screenshot the entire window. Currently only `null is supported due to having
  to use chromedriver in Node; use the separate Python screenshot script if
  needed

## Taking screenshots only

### Python implementation

This works best, as long as you use Firefox (for now this is just hardcoded in
the script) it supports taking screenshots of individual elements as well as
screenshots of the entire viewport.

On Ubuntu: Either (not sure this works)

```
sudo apt install python-virtualenv
virtualenv vcr-env
source vcr-env/local/bin/activate
pip install selenium
```

or (installs globally)

```
sudo apt install python3-pip
sudo pip3 install selenium
```

Regardless:

download geckodriver from https://github.com/mozilla/geckodriver/releases
extract to e.g. \~/bin and export PATH=$PATH:\~/bin

```
python vcr-capture.py tests.json screenshots/foo
```

or for python3

```
python3 vcr-capture.py tests.json screenshots/foo
```


### Node implementation

This doesn't work that well currently, the JS Selenium bindings seem to be
broken for geckodriver, so can't use that (for now chromedriver is just
hardcoded in the script). And chromedriver doesn't support taking screenshots
of individual elements, apparently.

Installing:
```
nvm use
npm install
```

download chromedriver from https://sites.google.com/a/chromium.org/chromedriver/downloads
extract to e.g. \~/bin and export PATH=$PATH:\~/bin

Usage:
```
node vcr-capture.js tests.json screenshots/foo
```

## Comparing screenshots only

Installing:
```
nvm use
npm install
```

Usage:
```
node vcr-compare.js screenshots/foo screenshots/bar
```

## Generating report only

Installing:
```
nvm use
npm install
```

Usage:
```
node vcr-report.js result.json template.njk
```
