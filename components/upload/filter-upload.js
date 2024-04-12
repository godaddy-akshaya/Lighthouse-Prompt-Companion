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

const FilterFreeFormText = ({ }) => {
    return (
        <TextInput label='Interaction IDs' name='example' helpMessage='Paste Interaction Ids seperated by space or comma' />
    )
}
const FilterUpload = ({ onChange }) => {
    const buttonRef = React.useRef();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
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
                setFile(uploadedFile);
                setRowCount(`${result.data?.length - 1 || 0}`)
                setPreCheckTag('success');
                setLoading(false);
                onChange({ data: result.data.map((row) => row[columnName]), name: columnName });
            },
            header: true
        });
    };
    const handleCancel = useCallback(() => {
        setFile(null);
        setRowCount(null);
        setLoading(false);
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
                        <Block orientation='vertical'>

                            <>  <Block>
                                <text.span as='caption' text='Upload a CSV file with a single column of Interaction IDs' />
                            </Block>

                                <Block>
                                    <input className='ux-button ux-button-secondary' type="file" onChange={handleFileChange} />
                                </Block>
                                <Block>
                                    <UploadTemplate />
                                </Block>

                                {/* <div class='text-center'>
                                    <text.label text='OR' as='label' />
                                </div>
                                <Block>
                                    <Lockup>
                                        <FilterFreeFormText />
                                    </Lockup>
                                </Block> */}
                            </>

                            <Block>
                                <SiblingSet gap='sm'>
                                    {file && <Button text='Cancel' size='small' design='critical' onClick={() => setFile(null)} />}
                                    <Button text='Close' size='small' design='secondary' onClick={() => setOpen(false)} />
                                </SiblingSet>
                            </Block>

                        </Block>
                    </Card>
                }
            </Flyout>
            <Block>
                {loading && <Spinner size='sm' />}
                {file &&
                    <SiblingSet gap='sm'>
                        <text.span as='caption' text='Interaction_ID' />
                        <Button text={`${rowCount} rows`} size='small' design='secondary' />
                        <Button text='' icon={<X />} size='small' design='critical' onClick={handleCancel} />
                    </SiblingSet>
                }
            </Block>

        </Lockup>
    )
};

export default FilterUpload;
