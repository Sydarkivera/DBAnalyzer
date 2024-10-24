import React from 'react';
import { FiLoader } from 'react-icons/fi';

import './Spinner.css';

function Spinner() {
  return (
    <div className="loader center">
      <FiLoader className="icon-spin" />
    </div>
  );
}

export default Spinner;
