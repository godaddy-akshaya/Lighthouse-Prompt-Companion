import React, { useEffect } from 'react';
import { useState } from 'react';
import { Block, Lockup } from '@ux/layout';
import Card from '@ux/card';
import Papa from 'papaparse';
import text from '@ux/text';
import TextInput from '@ux/text-input';
import SelectInput from '@ux/select-input';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import FileUpload from '@ux/file-upload';
import Upload from '@ux/icon/upload';
import Flyout from '@ux/flyout';
import Table from '@ux/table';


const UploadCount = ({ records }) => {
    // Count of items uploaded
    return (
        <>
            <text.span as='caption' text='Records' />
            <text.p as='label' text={records} />
        </>

    )
}
const DownloadTemplate = ({ }) => {
    // Download template for upload
    return (
        <Block>
            <text.p as='label' text='Download Template' />
        </Block>
    )

}
const UploadDisplay = ({ name }) => {
    // Will be a list of items that were uploaded
    return (
        <Block>
            <text.p as='label' text={name} />
        </Block>

    )
}
const ButtonTitle = ({ }) => {
    return (
        <text.span as='caption' text='Upload Interaction IDs' />
    )

}
const ColumnName = ({ columnName }) => {
    return (
        <>
            <text.span as='caption' text='Column Name' />
            <text.p as='label' text={columnName} />
        </>
    )
}

const FilterUpload = ({ onChange }) => {
    const buttonRef = React.useRef();
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState(null);
    const [preCheck, setPreCheck] = useState(null);
    const [preCheckTag, setPreCheckTag] = useState(null);

    const processFile = (uploadedFile) => {
        if (uploadedFile) {
            const fileExtension = uploadedFile.name.split('.').pop();
            if (fileExtension === 'csv') {
                processCSVFile(uploadedFile);
            } else {
                alert('Invalid file type');
            }
        }
    };

    const processCSVFile = (uploadedFile) => {
        Papa.parse(uploadedFile, {
            error: (error) => {
                console.log(error);
                setPreCheck('Error parsing file');
                setPreCheckTag('error');
            },
            complete: (result) => {
                console.log(result);
                setFile(uploadedFile);
                setFileData(result.data);
                setPreCheck(`${result.data?.length - 1 || 0}`)
                setPreCheckTag('success');
            },
            header: true
        });
    };
    const handleFileChange = (e) => {
        processFile(e[0]);
    };
    return (
        <>
            <Button text={<ButtonTitle />} design='secondary' as='select' icon={<Upload />} ref={buttonRef} onClick={() => setOpen(!open)} />
            <Flyout className='z-me' anchorRef={buttonRef}>
                {open &&
                    <Card>
                        <Block>


                            {!file && <Lockup>
                                <DownloadTemplate />
                                <FileUpload multiple={false} onChange={handleFileChange} />
                            </Lockup>
                            }

                            <Lockup>
                                {file &&
                                    <>
                                        <Table className='ux ux-table'>
                                            <tr>
                                                <td>
                                                    <UploadCount records={preCheck} />
                                                </td>
                                                <td>
                                                    <ColumnName columnName={fileData?.length > 0 ? Object.keys(fileData[0])[0] : 'Not Found'} />
                                                </td>
                                            </tr>
                                        </Table>
                                        <Button text='Cancel' size='small' design='secondary' onClick={() => setFile(null)} />
                                    </>
                                }
                            </Lockup>
                            <Button className='m-t-1' text='Close' size='small' design='secondary' onClick={() => setOpen(false)} />
                        </Block>
                    </Card>
                }
            </Flyout >
        </>

    )
};

export default FilterUpload;
