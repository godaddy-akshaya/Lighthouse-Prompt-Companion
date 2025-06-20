import '../styles/global.scss';
import { withAuthRequired, withAuthProvider } from '@godaddy/gasket-auth';
import { createApp, reportWebVitals } from '@godaddy/gasket-next';
import gasket from '../gasket';

function Layout(props) {
  const { Component, pageProps } = props;

   return (
     <Component { ...pageProps } />
   );
 }

const App = createApp({ Layout, initialProps: true });

export default [
  withAuthProvider(),
].reduce((cmp, hoc) => hoc(cmp), App);

export { reportWebVitals };


