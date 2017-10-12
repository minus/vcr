const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const nunjucks = require('nunjucks');
const path = require('path');

function createReport(resultArray, templatePath) {
    addTestNames(resultArray);
    return nunjucks.render(templatePath, {'results': resultArray});
}

function addTestNames(resultArray) {
    resultArray.forEach(result => {
        result.name = path.basename(result.test, '.png');
    });
}

if (require.main === module) {
    if (process.argv.length < 4) {
        console.log('Usage: node vcr-report.js [result_json] [template]');
        process.exit(1);
    }

    const resultJsonPath = process.argv[2];
    const templatePath = process.argv[3];

    fs.readFileAsync(resultJsonPath, 'utf8')
        .then(json => {
            return JSON.parse(text);
        }).then(resultData => {
            const report = createReport(resultData, templatePath);
            console.log(report);
        }).catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = createReport;
