import React, { useState } from 'react';
import Button from '@ux/button';
import TextInput from '@ux/text-input';
import { Block, Lockup } from '@ux/layout';
import text from '@ux/text';
import SiblingSet from '@ux/sibling-set';
import FieldFrame from '@ux/field-frame';
import X from '@ux/icon/x';
import Upload from '@ux/icon/upload';

const LoadedFilter = ({ rowCount, columnName, onClear }) => {

    const handleCancel = (e) => {
        e.preventDefault();
        onClear(columnName);
    }
    return (
        <Lockup className='m-t-1'>
            <text.label as='label' text={`${columnName}`} />
            <br />
            <FieldFrame>
                <Block>
                    <SiblingSet gap='md'>
                        <text.label as='label' text={`${rowCount} Records`} />
                        <Button icon={<X />} design='inline' onClick={handleCancel} />
                    </SiblingSet>
                </Block>

            </FieldFrame> </Lockup>

    )
}


export default LoadedFilter;