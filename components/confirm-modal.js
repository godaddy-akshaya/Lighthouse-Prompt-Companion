import React from 'react';
import Modal from '@ux/modal';
import Box from '@ux/box';
import Button from '@ux/button';
import Card from '@ux/card';


function ConfirmModal({ onClose, onConfirm, title, children }) {
  return (
    <Modal onClose={onClose} title={title}>
      <Card id='confirm-modal' space={{ block: 'lg', inline: 'lg' }}>
        <Box blockPadding='lg' gap='lg'>
          {children}
          <Button size='sm' onClick={onConfirm}>Confirm</Button>
          <Button size='sm' onClick={onCancel} text='Cancel' />
        </Box>
      </Card>
    </Modal>
  )
}

export default ConfirmModal;