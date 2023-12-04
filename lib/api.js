
const express = require('express');
const app = express();
const port = 3000;

/*
    getTableSchema
    applyTableParameters -> return transactions from filter
    
    getTableData --> Apply table parameters and return data will return query and dataframe

*/
const fakeData = [
    {
        "values": "{'7', '0', '5', '10', '9', '8', '6', '2', '3', '4', '1'}",
        "column_name": "css_score"
    }
    ,
    {
        "values": "{'TRUE', 'FALSE'}",
        "column_name": "repeat_contact_flag"
    }
    ,
    {
        "values": "{'Germany', 'Canada', 'India', 'United Kingdom', 'United States', 'Australia', 'China', 'Rest of World (RoW)'}",
        "column_name": "customer_type_name"
    }
    ,
    {
        "values": "{'7', '0', '5', '10', '9', '8', '6', '2', '3', '4', '1'}",
        "column_name": "nps_score"
    }
]

const model = {
    getTables: '',
    getTableColumns: '',
    tables: [],
    fields: [],
    includeEval: false,
    showParams: false,
    count: 0,
}
