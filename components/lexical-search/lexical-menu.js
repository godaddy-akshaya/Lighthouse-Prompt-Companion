import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem, MenuSeparator, MenuGroup } from '@ux/menu';
import example from '../../lib/lexical-search/example-1';
import Hamburger from '@ux/icon/hamburger';


const LexicalMenu = ({ onAction, queries }) => {
  const handleLexicalSelect = (item) => {
    console.log(item);
    onAction({ type: 'load', data: item });
  }
  const handleSelect = (value) => {
    if (value === 'example') {
      onAction({ type: 'example', data: JSON.stringify(example, null, 4) });
    }
    if (value === 'new') {
      onAction({ type: 'new', data: '' });
    }
  }
  return (
    <>

      <Menu id='lexical-menu'>
        <MenuButton icon={<Hamburger />} size='sm' text='Lexical Menu' design='secondary' />
        <MenuList >
          <MenuGroup className='open-save-menu-group' label='Open Saved Query'>
            {!queries && <MenuItem valueText='no-queries' >No queries found</MenuItem>}
            {queries?.sort((a, b) => a.query_name?.localeCompare(b.query_name)).map((item, index) => {
              return (
                <MenuItem key={index} valueText={item} onSelect={handleLexicalSelect}>{item.query_name}
                </MenuItem>
              )
            })}
          </MenuGroup>
          <MenuSeparator />
          <MenuItem valueText={'new'} onSelect={handleSelect}>New Query</MenuItem>
          <MenuItem valueText={'example'} onSelect={handleSelect}>Use Example</MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}



export default LexicalMenu;