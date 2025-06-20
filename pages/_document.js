import { makeDocument } from '@godaddy/gasket-next/document';
import { withGasketData } from '@gasket/nextjs/document';
import * as NextDocument from 'next/document';
import gasket from '../gasket.js';

export default withGasketData(gasket)(makeDocument(gasket, NextDocument));
