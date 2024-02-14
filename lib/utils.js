const getGuid = async () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function toProperJson(str) {
    let newArray = str.replace('{', '').replace('}', '').replaceAll("'", '');
    return newArray.split(',');
}
function sortSelectOptions(options, dataType) {
    if (dataType === 'int') {
        return options.sort((a, b) => {
            if (Number(a) < Number(b)) {
                return -1;
            }
            return 1;
        });
    }
    return options.sort((a, b) => {
        if (a < b) {
            return -1;
        }
        return 1;
    });
}
function sortArray(arr, by, asc = true) {
    if (asc) {
        return arr.sort((a, b) => {
            if (a[by] < b[by]) {
                return -1;
            }
            return 1;
        });
    }
    return arr.sort((a, b) => {
        if (a[by] < b[by]) {
            return 1;
        }
        return -1;
    });
}

function copyToClipBoard(text) {
    navigator.clipboard.writeText(text);
}

function toTitleCase(str) {
    return str.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

module.exports = { getGuid, toProperJson, toTitleCase, sortSelectOptions, sortArray, copyToClipBoard };