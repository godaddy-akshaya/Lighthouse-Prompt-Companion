import React from 'react';
import Button from '@ux/button';


function downloadJSONAsCSV(data, filename) {
    let csv = '';
    const keys = Object.keys(data[0]);
    console.log(keys);
    csv += keys.join(',') + '\n';

    data.forEach(row => {
        keys.forEach((key, i) => {
            if (i > 0) csv += ',';
            csv += row[key];
        });
        csv += '\n';
    });

    const blob = new Blob([data], { type: 'text/csv' });
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