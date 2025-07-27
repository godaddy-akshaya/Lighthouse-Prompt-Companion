import "../styles/global.scss";
import { withAuthRequired, withAuthProvider } from "@godaddy/gasket-auth";
import {
  createApp,
  reportWebVitals,
  withPageEnhancers,
} from "@godaddy/gasket-next";
import gasket from "../gasket";

/* auth */
function customSubdomain(host) {
  const parts = host.split(":")[0].split(".").slice(0, -2);
  if (parts.length >= 3) return parts.join(".");
}

function Layout(props) {
  const { Component, pageProps } = props;

  return <Component {...pageProps} />;
}

const App = createApp({ Layout, initialProps: true });
const authRequired = withAuthRequired({
  realm: "jomax",
  ssoRedirectSubdomain: customSubdomain,
  gasket,
});

export default withAuthProvider()(withPageEnhancers([authRequired])(App));

export { reportWebVitals };
