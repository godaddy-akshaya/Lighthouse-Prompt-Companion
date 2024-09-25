import React from 'react';
import Modal from '@ux/modal';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import Box from '@ux/box';
import text from '@ux/text';

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <Modal onClose={onCancel} title={title}>
      <text.label as='label' text={message} />
      <Box id='confirm-modal' space={{ block: 'lg', inline: 'lg' }}>

        <SiblingSet gap='md'>
          <Button size='sm' onClick={onConfirm} text='Yes' />
          <Button size='sm' onClick={onCancel} text='No' />
        </SiblingSet>
      </Box>
    </Modal>
  )
}

export default ConfirmModal;