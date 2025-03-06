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
          active: props?.route === 'home'
        },
        {
          caption: 'Run Status',
          key: '2',
          href: '/run-status',
          eid: 'pep.prompt-ui.nav.results.click',
          icon: 'checkbox-list',
          active: props?.route === 'status'
        },
        {
          caption: 'Lexical Search',
          key: '3',
          href: '/lexical-search',
          eid: 'pep.prompt-ui.nav.lexical-search.click',
          icon: 'search',
          active: props?.route === 'search'
        },
        {
          caption: 'Insights',
          key: '4',
          eid: 'uxp.lighthouse.nav.insights.click',
          active: props?.route === 'insights',
          icon: 'bar-graph',
            children: [
            {
              caption: "Lighthouse Intents",
              href: "/insights?dashboardId=ec5da3b7-a5d8-4685-a334-6e14381daca9?title=Lighthouse%20Intents",
              eid: "uxp.lighthouse.nav.insights.click"
            },
            {
              caption: "Contact Driver",
              href: "/insights?dashboardId=35ba3d06-ed89-499a-8d1b-5176205eee64&title=Contact%20Driver",
              eid: "uxp.example.settings.bar.click"
            },
            {
              caption: "Intents Insights",
              href: "/insights?dashboardId=e43656f2-ad59-454a-8825-5e7c0effb3ab&title=Intents%20Insights",
              eid: "uxp.example.settings.bar.click"
            }
        ] 
        }
      ]);
    });
  }, []);
  return (
    <NextHead>
      <meta charSet='UTF-8' />
      <title>{props.title}</title>
      <meta name='description' content={props.description} />
      <meta name='viewport' content='width=device-width, initial-scale=1, shrink-to-fit=no' />
    </NextHead>
  );
};

Head.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  route: PropTypes.string
};

export default Head;
