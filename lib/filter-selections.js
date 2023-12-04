
function returnArrayOfNumbers(amt) {
    let arr = [];
    for (let i = 0; i < amt; i++) {
        arr.push(i);
    }
    return arr;
}

module.exports = {
    tables: [],
    columns: [],
    columnSelections: [],
    options: {
        nps: () => returnArrayOfNumbers(10),
        scores: () => returnArrayOfNumbers(10),
        rate: ['', 'test']
    }
}