import React, { useState } from 'react';
import Button from '@ux/button';
import TextInput from '@ux/text-input';
import { Block, Lockup } from '@ux/layout';
import text from '@ux/text';
import Checkbox from '@ux/checkbox';
import Save from '@ux/icon/save';

const SaveObjectForm = ({ onSave, hasBeenSaved }) => {
    const [toSave, setToSave] = useState(false)
    const [saveAs, setSaveAs] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const handleCheckbox = (e) => {
        setToSave(!toSave);
    }
    const handleSaveAs = (e) => {
        setSaveAs(e);
    }
    const handleSave = (e) => {
        e.preventDefault();
        if (saveAs === '') {
            setErrorMessage('Name is required');
            return;
        }
        onSave(saveAs)
    }
    return (
        <Lockup>
            {hasBeenSaved && <text.label text='Upload has been saved' />}
            {!hasBeenSaved &&
                <>
                    <Checkbox id='save-filter' name='save-filter' checked={toSave} onChange={handleCheckbox} label='Save this upload?' />

                    {toSave &&
                        <Block orienatation='vertical'>
                            <Lockup>
                                <text.label as='label' text='Save As:' />
                                <TextInput value={saveAs} onChange={handleSaveAs} errorMessage={errorMessage} placeHolder='Name of upload...' />
                            </Lockup>
                            <Button onClick={handleSave} className='m-t-1' text='Save' size='small' icon={<Save />} design='secondary' />
                        </Block>
                    }
                </>
            }
        </Lockup>
    )
}


export default SaveObjectForm;