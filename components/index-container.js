import React, { useEffect, useState } from 'react';
const fetch = require('@gasket/fetch');
const indexContainer = () => {
    // Get all the tables from api, get url from config file
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = 'e2048a70-aa2a-4665-8843-8e24dba61b58';


    // useEffect(() => {
    //   fetch('https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Access-Control-Allow-Origin': '*',
    //       'token': 'e2048a70-aa2a-4665-8843-8e24dba61b58'
    //     }
    //   })
    //     .then(response => response.json())
    //     .then(data => {
    //       console.log(data);
    //       return data;
    //     }).catch((error) => {
    //       console.log(error);
    //     });
    // }, []);




}
// curl  -H "token:e2048a70-aa2a-4665-8843-8e24dba61b58" -X POST "https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev"
async function fetchUser() {
    // This is a mock function to simulate fetching user data
    // In a real app, this would be an API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ name: 'John Doe' });
        }, 1000);
    });
}




export default indexContainer;