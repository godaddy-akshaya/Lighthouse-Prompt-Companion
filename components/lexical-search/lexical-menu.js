import React, { use, useEffect, useState } from 'react';
import { Menu, MenuButton, MenuList, MenuItem, MenuSeparator } from '@ux/menu';
import Box from '@ux/box';
import Modal from '@ux/modal';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import Tag from '@ux/tag';
import { getAllLexicalQueries } from '../../lib/api';
import example from '../../lib/lexical-search/example-1';
import Hamburger from '@ux/icon/hamburger';


function ensureJSONString(obj) {
  if (typeof obj === 'string') {
    try {
      JSON.parse(obj);
      return obj; // It's already a JSON string
    } catch (e) {
      // It's a string but not a valid JSON string, so we stringify it
      return JSON.stringify(obj);
    }
  } else {
    // It's not a string, so we stringify it
    return JSON.stringify(obj);
  }
}

const OpenModal = ({ onClose, children }) => {
  return (
    <Modal onClose={onClose} title='Select Query'>
      <Box>
        {children}
      </Box>
    </Modal>
  )
}

const LexicalMenu = ({ onAction }) => {
  const lexicalMenuRef = React.createRef();
  const [lexicalQueries, setLexicalQueries] = useState([]);
  const [modal, setModal] = useState({
    show: false,
    action: '',
    title: ''
  });
  const handleLexicalSelect = (query) => {
    setModal({ ...modal, show: false });
    onAction({ type: 'load', data: query });
  }
  const handleSelect = (value) => {

    if (value === 'open') {
      setModal({ ...modal, show: true, action: 'open', title: 'Open Query' });
    }
    if (value === 'example') {
      onAction({ type: 'example', data: JSON.stringify(example, null, 4) });
    }
  }
  useEffect(() => {
    getAllLexicalQueries().then((response) => {

      console.log(response?.length || 'na');
      try {
        let data = response?.map((query) => {
          console.log(query);
          return {
            query_name: query.query_name,
            query: ensureJSONString(query.query)
          }
        }) || [];
        setLexicalQueries(data);
      } catch (e) {
        setLexicalQueries([]);
      }
    });
  }, []);
  return (
    <>
      {modal.show && <OpenModal onClose={() => setModal({ ...modal, show: false })}>
        {lexicalQueries.length === 0 && <Tag empahsis='neutral' text='No queries found' />}
        <SiblingSet orientation='vertical' gap='sm'>

          {lexicalQueries.map((query, index) => {
            return (
              <Button key={index} size='sm' onClick={() => handleLexicalSelect(query)} design='inline' text={query.query_name} />
            )
          })}
        </SiblingSet>
      </OpenModal>
      }

      <Box displayType='box' orientation='horizontal' inlineAlignChildren='end'>
        <Box blockAlignChildren='end' >
          <Menu ref={lexicalMenuRef} id='lexical-menu'>
            <MenuButton icon={<Hamburger />} size='sm' text='' />
            <MenuList style={{ 'overflow-y': 'auto', 'max-height': '250px' }}>
              <MenuItem valueText={'open'} onSelect={handleSelect}>Open Query </MenuItem>
              <MenuSeparator />
              <MenuItem valueText={'example'} onSelect={handleSelect}>Use Example</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>
    </>
  );
}



export default LexicalMenu;