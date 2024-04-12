import React, { useCallback } from 'react';
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
import Spinner from '@ux/spinner';
import Table from '@ux/table';
import X from '@ux/icon/x';
import '@ux/icon/x/index.css';
import UploadTemplate from './upload-template';
import Download from '@ux/icon/download';


const ButtonTitle = ({ }) => {
    return (
        <text.span as='caption' text='Upload Interaction IDs' />
    )
}

const FilterFreeFormText = ({ eventChange, textValue = '' }) => {
    function handleChange(e) {
        let separator = e.includes(',') ? ',' : ' ';
        let result = e.split(separator);
        eventChange({ data: result, name: 'interaction_id' });
    }
    return (
        <TextInput className='m-t-1' label='Paste Interaction IDs' value={textValue} onChange={handleChange} name='example' helpMessage='Paste Interaction Ids seperated by space or comma' />
    )
}
const FilterUpload = ({ onChange }) => {
    const buttonRef = React.useRef();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileData, setFileData] = useState(null);
    const [rowCount, setRowCount] = useState(null);
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
                const columnName = Object.keys(result.data[0])[0];
                setRowCount(`${result.data?.length - 1 || 0}`)
                setFileData(result.data.map((row) => row[columnName]));
                setPreCheckTag('success');
                setLoading(false);
                onChange({ data: result.data.map((row) => row[columnName]), name: columnName });
            },
            header: true
        });
    };
    const handleFilterFreeForm = ((data) => {
        console.log(data);
        setRowCount(data.data.length);
        setFileData(data.data);
        setOpen(false);
        onChange(data);
    });
    const handleCancel = useCallback(() => {
        setRowCount(null);
        setLoading(false);
        setFileData(null);
        setOpen(false);
        onChange({ data: [], name: '' });
    });
    const handleFileChange = useCallback((e) => {
        setOpen(false);
        setLoading(true);
        processFile(e.target.files[0]);
    });
    return (
        <Lockup>
            <Button ref={buttonRef} text={<ButtonTitle />} design='secondary' as='select' icon={<Upload />} onClick={() => setOpen(!open)} />
            <Flyout className='z-me' stretch={false} anchorRef={buttonRef}>
                {open &&
                    <Card>
                        <Block className='text-center' orientation='vertical'>
                            <>

                                <text.label as='label' text='Upload a CSV file with a single column of Interaction IDs' /><br />
                                <Block>

                                    <Lockup>
                                        <input className='m-t-1 ux-button ux-button-secondary' type="file" onChange={handleFileChange} />
                                    </Lockup>


                                </Block>

                                <text.label text=' - OR -' as='label' />


                                <Lockup>
                                    <FilterFreeFormText eventChange={handleFilterFreeForm} textValue={fileData?.toString() || null} />
                                </Lockup>

                            </>
                            <Block>
                                <SiblingSet gap='sm'>
                                    {fileData && <Button text='Cancel' size='small' design='critical' onClick={handleCancel} />}
                                    <Button text='Close' size='small' design='secondary' onClick={() => setOpen(false)} />
                                </SiblingSet>
                            </Block>
                            <UploadTemplate className='m-t-1' />
                        </Block>
                    </Card>
                }
            </Flyout>
            <Block>
                {loading && <Spinner size='sm' />}
                {fileData &&
                    <SiblingSet gap='sm'>
                        <text.label as='label' text={`Interaction_ID (${rowCount})`} />
                        <Button text='' icon={<X />} size='small' design='critical' onClick={handleCancel} />
                    </SiblingSet>
                }
            </Block>
        </Lockup>
    )
};

export default FilterUpload;
