/* eslint-disable */
const getGuid = async () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
function convertToCSV(objArray, headerList) {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  const headerRow = headerList.join(',');

  const rows = array.map((item) => {
    return headerList.map((header) => {
      let fieldValue = item?.[header] ?? '';

      // Trim whitespace
      fieldValue = fieldValue.trim();

      // Escape double quotes by doubling them
      fieldValue = fieldValue.replace(/"/g, '""');

      // Enclose the field in double quotes if it contains special characters
      if (/[\s,"]/g.test(fieldValue)) {
        fieldValue = `"${fieldValue}"`;
      }

      return fieldValue;
    }).join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

function toTitleCase(str) {
  return str.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
function textSearchArray(array, searchTerm) {
  if (!searchTerm) return array;
  return array.filter(item => {
    return item?.label?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });
}



module.exports = { getGuid, toTitleCase, sortSelectOptions, sortArray, copyToClipBoard, convertToCSV, textSearchArray };
