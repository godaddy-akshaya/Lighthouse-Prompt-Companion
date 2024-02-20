import React from 'react';
import Button from '@ux/button';
import { convertToCSV } from '../lib/utils';


function downloadJSONAsCSV(data, filename) {

    let csv = '';
    const keys = Object.keys(data[0]);
    csv += keys.join(',') + '\n';

    data.forEach(row => {
        keys.forEach((key, i) => {
            if (i > 0) csv += ',';
            csv += row[key];
        });
        csv += '\n';
    });
    const csv1 = convertToCSV(data, Object.keys(data[0]));
    console.log(csv);
    console.log(csv1);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default function DownloadButton({ data, filename }) {
    return (
        <Button design='secondary' onClick={() => downloadJSONAsCSV(data, filename)} text='Download' />
    )
};