const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const pixelmatch = require('pixelmatch');
const PNG = Promise.promisifyAll(require('pngjs')).PNG;

function compareImages(pathToRefs, pathToTests) {
    return Promise.all([
        fs.readdirAsync(pathToRefs),
        fs.readdirAsync(pathToTests)
    ]).spread((refPaths, testPaths) => {
        const testData = getRefAndTestPairs(pathToRefs, refPaths, pathToTests,
            testPaths);
        return Promise.all(testData.map(getTestResult));
    });
}

// Destructively alters refs and tests parameters(!)
function getRefAndTestPairs(pathToRefs, refs, pathToTests, tests) {
    const result = [];
    refs.sort();
    tests.sort();

    let haveMoreRefs = refs.length > 0;
    let haveMoreTests = tests.length > 0;
    while (haveMoreRefs || haveMoreTests) {
        let ref = null;
        let test = null;
        if (haveMoreRefs && haveMoreTests) {
            if (refs[0] === tests[0]) {
                ref = refs.shift();
                test = tests.shift();
            } else if (refs[0] < tests[0]) {
                ref = refs.shift();
            } else {
                test = tests.shift();
            }
        } else if (haveMoreRefs) {
            ref = refs.shift();
        } else {
            test = tests.shift();
        }
        result.push({
            'ref': ref === null ? null : path.join(pathToRefs, ref),
            'test': test === null ? null : path.join(pathToTests, test)
        });
        haveMoreRefs = refs.length > 0;
        haveMoreTests = tests.length > 0;
    }

    return result;
}

function getTestResult(testData) {
    return Promise.all([
        getImage(testData.test),
        getImage(testData.ref)
    ]).spread((testImage, refImage) => {
        let result = 'FAIL';
        let details = null;

        if (testImage === null) {
            details = 'Missing test screenshot';
        } else if (refImage === null) {
            details = 'Missing ref screenshot';
        } else {
            if (testImage.width !== refImage.width ||
                    testImage.height !== refImage.height) {
                // pixelmatch requires sizes to be the same
                details = 'Image size mismatch';
            } else {
                const diff = pixelmatch(testImage.data, refImage.data, null,
                        refImage.width, refImage.height, {threshold: 0.1});
                details = `${diff} pixels differ`;
                if (diff === 0) {
                    result = 'PASS';
                }
            }
        }

        return {
            'test': testData.test,
            'ref': testData.ref,
            'result': result,
            'details': details
        }
    });
}

function getImage(url) {
    if (url === null) {
        return  null;
    }
    return fs.readFileAsync(url)
        .then(data => {
            return new PNG().parseAsync(data);
        });
}

if (require.main === module) {
    if (process.argv.length < 4) {
        console.log('Usage: node vcr-compare.js [directory_1] [directory_2]');
        process.exit(1);
    }

    compareImages(process.argv[2], process.argv[3])
        .then(data => {
            console.log(JSON.stringify(data));
        })
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = compareImages;
