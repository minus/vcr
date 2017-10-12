const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const seleniumAssistant = require('selenium-assistant');

function captureMultiple(testcaseList, outputDir) {
    const browserId = 'chrome';
    const release = 'stable';

    return Promise.all([
        getTestcases(testcaseList),
        getWebDriver(browserId, release)
    ]).spread((testcases, driver) => {
        return Promise.all(Object.keys(testcases).map(testcase => {
            const tcData = testcases[testcase];
            const outputFile = path.join(outputDir, `${testcase}.png`);
            return screenshot(driver, tcData.url, tcData.selector, outputFile);
        })).then(() => {
            seleniumAssistant.killWebDriver(driver);
        });
    });
}

function getWebDriver(browserId, release) {
    const browser = seleniumAssistant.getLocalBrowser(browserId, release);
    return browser.getSeleniumDriver();
}

function getTestcases(testcaseFilePath) {
    return fs.readFileAsync(testcaseFilePath, 'utf8')
        .then(text => {
            return JSON.parse(text);
        });
}

function screenshot(driver, url, selector, outputFilePath) {
    return driver.get(url).then(() => {
            if (selector === null) {
                return driver.takeScreenshot();
            } else {
                return driver.findElement({css: selector})
                    .then((element) => {
                        element.takeScreenshot(true);
                    });
            }
        }).then((imageAsBase64) => {
            const buffer = new Buffer(imageAsBase64, 'base64');
            return fs.writeFileAsync(outputFilePath, buffer);
        });
}

if (require.main === module) {
    if (process.argv.length < 4) {
        console.log('Usage: node vcr-capture.js [tests_json_file] ' +
                '[output_directory]');
        process.exit(1);
    }

    captureMultiple(process.argv[2], process.argv[3])
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = captureMultiple;
