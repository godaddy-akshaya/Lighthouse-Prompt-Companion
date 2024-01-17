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
function toTitleCase(str) {
    return str.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

module.exports = { getGuid, toProperJson, toTitleCase };