import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import NextHead from 'next/head';


const Head = (props) => {
  useEffect(() => {
    ux.header((err, header) => {
      if (err) return console.error(err); // handle this as you wish

      header.updateSidebarNav([
        {
          caption: 'Home',
          key: '0',
          href: '/',
          eid: 'pep.prompt-ui.nav.home.click',
          icon: 'home',
          active: props?.route === 'home' ? true : false
        },
        {
          caption: 'Run Status',
          key: '2',
          href: '/run-status',
          eid: 'pep.prompt-ui.nav.results.click',
          icon: 'checkbox-list',
          active: props?.route === 'status' ? true : false
        }
      ]);
    });
  }, [])
  return (
    <NextHead>
      <meta charSet='UTF-8' />
      <title>{props.title}</title>
      <meta name='description' content={props.description} />
      <meta name='viewport' content='width=device-width, initial-scale=1, shrink-to-fit=no' />
    </NextHead>
  );
}

Head.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  route: PropTypes.string
};


export default Head;
