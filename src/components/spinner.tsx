import React from 'react';
// import {
//   FaRegCircle, FaRegCheckCircle, FaCog, FaSpinner,
// } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

import './spinner.css';

function Spinner() {
  return (
    <div className="loader center">
      {/* <i className="fa fa-cog fa-spin" /> */}
      <FiLoader className="icon-spin" />
    </div>
  );
}

export default Spinner;
