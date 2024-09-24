import React, { useEffect, useState } from 'react';
import { Menu, MenuButton, MenuList, MenuItem, MenuSeparator, MenuGroup } from '@ux/menu';

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



const LexicalMenu = ({ onAction }) => {
  const lexicalMenuRef = React.createRef();
  const [lexicalQueries, setLexicalQueries] = useState([]);
  const [modal, setModal] = useState({
    show: false,
    action: '',
    title: ''
  });
  const handleLexicalSelect = (query) => {
    onAction({ type: 'load', data: query });
  }
  const handleSelect = (value) => {
    if (value === 'example') {
      onAction({ type: 'example', data: JSON.stringify(example, null, 4) });
    }
  }
  useEffect(() => {
    getAllLexicalQueries().then((queries) => {
      try {
        let data = queries?.map((d) => {
          return {
            query_name: d.query_name,
            query: ensureJSONString(d.query)
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
      {modal.show && <ConfirmModal onClose={() => setModal({ show: false })} onConfirm={modal.action} title={modal.title} />}
      <Menu ref={lexicalMenuRef} id='lexical-menu'>
        <MenuButton icon={<Hamburger />} size='sm' text='' />
        <MenuList >
          <MenuGroup label='Open Saved Query'>
            {lexicalQueries.length === 0 && <MenuItem valueText='no-queries' >No queries found</MenuItem>}
            {lexicalQueries.map((item, index) => {
              return (
                <MenuItem key={index} valueText={item} onSelect={handleLexicalSelect}>{item.query_name}
                </MenuItem>
              )
            })}
          </MenuGroup>
          <MenuSeparator />
          <MenuItem valueText={'example'} onSelect={handleSelect}>Use Example</MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}



export default LexicalMenu;