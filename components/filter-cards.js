import React, { useState } from 'react';
import Card from '@ux/card';
import Checkbox from '@ux/checkbox';
import { Block } from '@ux/layout';
import text from '@ux/text';
import Button from '@ux/button';
import SiblingSet from '@ux/sibling-set';
import Checkmark from '@ux/icon/checkmark';
import Remove from '@ux/icon/remove';
import Collapsible from '@ux/collapsible';
import Tag from '@ux/tag';
import '@ux/tag/styles';
import '@ux/collapsible/styles';

const filterCards = ({ options, label, id, open, onChange, onSelectAll, onDeselectAll }) => {
    const [optionSize, setOptionSize] = useState(options.column_values.length > 12 ? 'restricted-height' : 'full-height');
    const handleOnChange = (e) => {
        let model = {
            label: e.target.id,
            value: e.target.checked,
            column: id
        }
        onChange(model);
    }
    const handleSelectAll = () => {
        onSelectAll(options);
    }
    const handleRemoveAll = () => {
        onDeselectAll(options);
    }
    const SelectionCountTitle = () => (
        <>
            <div className='lh-title'>
                <text.label as='label' text={label} /><br />
                <text.label as='caption' text={`${options?.checkbox_columns.filter(r => r.value).length} of ${options?.column_values.length}`} />
            </div>
        </>
    )
    return (
        <>
            <Card className='lh-filter-card' stretch={true} id={id}>
                <Collapsible defaultOpen={open ? open : false} id={id} className='lh-no-padding' title={<SelectionCountTitle />}>

                    <Block className='lh-content'>
                        <div className='lh-controls'>
                            <SiblingSet gap='sm'>
                                <Button design='inline' onClick={handleSelectAll} size='small' aria-label='Select All' icon={<Checkmark />} />
                                <Button design='inline' onClick={handleRemoveAll} size='small' aria-label='Remove All' icon={<Remove />} />
                            </SiblingSet>
                        </div>

                        <div className={`columns ${optionSize}`}>
                            {options?.checkbox_columns?.map(item => <div key={item.label} className='column'><Checkbox key={item.label} id={item.label} label={item.label} name={item.label} onClick={handleOnChange} checked={item.value} /></div>) || null}
                        </div>
                        <text.label as='caption' text={`${options?.checkbox_columns.filter(r => r.value).length} of ${options?.column_values.length}`} />
                    </Block> </Collapsible>
            </Card>


        </>
    )
}

export default filterCards;