import React, { useState } from 'react';
import Card from '@ux/card';
import Checkbox from '@ux/checkbox';
import { Block } from '@ux/layout';
import text from '@ux/text';
import Button from '@ux/button';
import SiblingSet from '@ux/sibling-set';
import Checkmark from '@ux/icon/checkmark';
import Remove from '@ux/icon/remove';

const filterCards = ({ options, label, id, onChange, onSelectAll, onDeselectAll }) => {
    const [optionSize, setOptionSize] = useState(options.column_values.length > 12 ? 'restricted-height' : 'full-height');
    const handleOnChange = (e) => {
        console.log(options, e);
        onChange(e);
    }
    const handleSelectAll = () => {
        onSelectAll(options);

    }
    const handleRemoveAll = () => {
        onDeselectAll(options);
    }
    return (
        <>
            <Card className='lh-filter-card' stretch={true} id={id}>
                <Block className='lh-title'>
                    <text.h3 text={label} as='title' />
                    <div className='lh-controls'>
                        <SiblingSet gap='sm'>
                            <Button design='inline' onClick={handleSelectAll} size='small' aria-label='Select All' icon={<Checkmark />} />
                            <Button design='inline' onClick={handleRemoveAll} size='small' aria-label='Remove All' icon={<Remove />} />
                        </SiblingSet>
                    </div>
                </Block>
                <Block className='lh-content'>
                    <text.label as='caption' text={`${options?.column_selected_values.length} of ${options?.column_values.length}`} />
                    <div className={`columns ${optionSize}`}>
                        {options?.checkbox_columns?.map(item => <div key={item.label} className='column'><Checkbox id={item.label} label={item.label} name={item.label} checked={item.value} /></div>) || null}
                    </div>
                </Block>

            </Card>
        </>
    )
}

export default filterCards;