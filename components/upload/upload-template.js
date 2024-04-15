import React from 'react';
import Button from '@ux/button';
import Download from '@ux/icon/download';

const UploadTemplate = ({ }) => {
    const fileUrl = '/template_filter_import.csv';
    function handleClick() {
        window.open(fileUrl);
    }
    return (
        <>
            <Button size='small' as='button' design='inline' text='Template for convenience' onClick={handleClick} icon={<Download />} />
        </>
    )
}
export default UploadTemplate;