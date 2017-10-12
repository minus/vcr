#!/usr/bin/python3
import argparse
import errno
import json
import os

from selenium import webdriver

def capture_multiple(testcase_list, output_dir):
    """Capture and save multiple screenshots.

    Arguments:
    testcase_list -- path (relative to working directory) to JSON file
        describing which pages/elements to screenshot. Format:
        {
            "tc_name": {
                "url": <url of page where screenshot should be taken>
                "selector": <CSS selector to element, or null>
            },
            ... (possibly more testcases, with other names)
        }
        For each testcase, a screenshot will be taken of the first element on
        the given page that matches the selector, or of the entire window if
        selector is null.
    output_dir -- path (relative to working directory) to directory
        where screenshots will be saved. The directory must already exist. The
        screenshots will have file names on the form <tc_name>.png where
        <tc_name> is the name of the relevant testcase as given by the input
        JSON.
    """
    testcase_file = open(testcase_list, 'r')
    testcases = json.load(testcase_file)

    if not os.path.exists(output_dir):
        raise FileNotFoundError(
                errno.ENOENT, os.strerror(errno.ENOENT), output_dir)

    driver = webdriver.Firefox()
    for testcase_name, testcase_data in testcases.items():
        driver.get(testcase_data['url'])
        screenshot_path = output_dir + '/' + testcase_name + '.png'
        selector = testcase_data['selector']
        if (selector is None):
            driver.get_screenshot_as_file(screenshot_path)
        else:
            element = driver.find_element_by_css_selector(selector)
            element.screenshot(screenshot_path)
    driver.quit()

if __name__ == '__main__':
    json_details = """
        Format of testcases JSON:
        {"tc_name":{"url":"...","selector":<css_selector_or_null>,...}
    """
    parser = argparse.ArgumentParser(epilog=json_details)
    parser.add_argument('testcase_json',
        help='path to JSON describing what to screenshot')
    parser.add_argument('output_directory',
        help='path to directory in which to put the screenshots')
    args = parser.parse_args()
    capture_multiple(args.testcase_json, args.output_directory)
