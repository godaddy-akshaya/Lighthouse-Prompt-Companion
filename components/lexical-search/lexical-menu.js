import React, { useEffect, useState } from 'react';
import { Menu, MenuButton, MenuList, MenuItem, MenuSeparator } from '@ux/menu';
import Box from '@ux/box';
import Modal from '@ux/modal';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import Tag from '@ux/tag';
import example from '../../lib/lexical-search/example-1';
import text from '@ux/text';
import Hamburger from '@ux/icon/hamburger';


const OpenModal = ({ show, onClose, children }) => {
  return (
    <>
      {show &&
        <Modal onClose={onClose} title='Open Query'>
          <Box>
            {children}
          </Box>
        </Modal>
      }
    </>)
}

const LexicalMenu = ({ onAction }) => {
  const lexicalMenuRef = React.createRef();
  const [modal, setModal] = useState({
    show: false,
    action: '',
    title: ''

  });
  const openOptions = ['joe', 'moe', 'larry'];
  const handleSelect = (value) => {
    console.log(value);
    if (value === 'Open') {
      setModal({ ...modal, show: true, action: 'open', title: 'Open Query' });
    }
    if (value === 'example') {
      console.log(example);
      onAction({ type: 'example', data: JSON.stringify(example, null, 4) });
    }
  }

  const myAction = value => alert(`Item Selected ${value}`);

  return (

    <Box displayType='box' blockAlignChildren='end' orientation='horizontal'>
      <OpenModal show={modal.show} onClose={() => setModal({ ...modal, show: false })}>
        <Box>
          <text.label as='label' text={modal.title} />
          <SiblingSet orientation='vertical' gap='sm'>
            {openOptions.map((option, index) => (
              <Button size='sm' key={index} text={option} onClick={() => myAction(option)} />
            ))
            }
          </SiblingSet>
        </Box>
      </OpenModal>
      <Menu ref={lexicalMenuRef} id='lexical-menu'>
        <MenuButton icon={<Hamburger />} design='secondary' size='sm' text='' />
        <MenuList style={{ 'overflow-y': 'auto', 'max-height': '250px' }}>
          <MenuItem valueText={'open'} onSelect={handleSelect}>Open</MenuItem>
          <MenuSeparator />
          <MenuItem valueText={'example'} onSelect={handleSelect}>Use Example</MenuItem>
        </MenuList>
      </Menu>
    </Box>

  );

}



export default LexicalMenu;