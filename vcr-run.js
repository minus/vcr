const Promise = require('bluebird');
const exec = require('child_process').exec;
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');

const vcrCapture = require('./vcr-capture');
const vcrCompare = require('./vcr-compare');
const vcrReport = require('./vcr-report');

function takeScreenshots(testcaseList, branch, projectDirectory) {
    return getGitSha(branch, projectDirectory).then(sha => {
        const screenshotDir = path.join('screenshots', sha);
        const screenshotDirExists = fs.existsSync(screenshotDir);
        if (screenshotDirExists) {
            console.log(`Screenshots already exist for ${sha}, skipping…`);
            return screenshotDir;
        }
        fs.mkdirSync(screenshotDir);
        return checkoutGitSha(sha, projectDirectory).then(() => {
            console.log(`Executing tests for ${sha}`);
            return vcrCapture(testcaseList, screenshotDir);
        }).then(() => {
            return screenshotDir;
        });
    });
}

function getGitSha(branch, projectDirectory) {
    return new Promise((resolve, reject) => {
        const command = `git rev-parse ${branch}`;
        exec(command, {cwd: projectDirectory}, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

function checkoutGitSha(sha, projectDirectory) {
    return new Promise((resolve, reject) => {
        const command = `git checkout ${sha}`;
        exec(command, {cwd: projectDirectory}, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

function createTemplateContext(resultData, branch1, branch2) {
    return {
        'testSha': branch1,
        'refSha': branch2,
        'results': resultData,
        'dateExecuted': new Date().toString(),
    };
}

if (require.main === module) {
    if (process.argv.length < 6) {
        console.log('Usage: node vcr-run.js [project_directory] [test_json] ' +
                '[branch_1] [branch_2]');
        process.exit(1);
    }

    const projectDirectory = process.argv[2];
    const testJsonPath = process.argv[3];
    const branch1 = process.argv[4];
    const branch2 = process.argv[5];
    const reportPath = 'vcr-results.html';

    let dir1 = null;
    takeScreenshots(testJsonPath, branch1, projectDirectory).then(dir => {
        dir1 = dir;
        return takeScreenshots(testJsonPath, branch2, projectDirectory);
    }).then(dir2 => {
        return vcrCompare(dir1, dir2);
    }).then(resultData => {
        return vcrReport(resultData, 'template.njk');
    }).then(resultDocument => {
        fs.writeFileAsync(reportPath, resultDocument);
    });
}
