import React from 'react';
import Button from '@ux/button';
import { convertToCSV } from '../lib/utils';
import Download from '@ux/icon/download';

function downloadJSONAsCSV(data, filename) {

    const keys = Object.keys(data[0]);
    const csv = convertToCSV(data, keys);
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
        <Button onClick={() => downloadJSONAsCSV(data, filename)} text='Download' icon={<Download />} />
    )
};