import React, { useState, MouseEvent } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import Spinner from './spinner';

interface Props {
  title?: string,
  isReady: boolean,
  isRunning: boolean,
  isComplete: boolean,
  children: React.ReactNode,
  onClick?: Function
 }

const ExpandableListItem = ({
  title, children, isReady, onClick, isRunning, isComplete,
}: Props) => {
  const [expanded, setExpanded] = useState(false);

  const expandRow = (e: MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const onStart = (e: MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      setExpanded(true);
      onClick();
    }
  };

  return (
    <div className="list-item" onClick={expandRow}>
      <div style={{ flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {isComplete && <FaCheck style={{ marginRight: 10 }} />}
          <p style={{ fontWeight: 'bold' }}>{title}</p>
          {isReady && onClick !== undefined && !isRunning && (
          <button
            style={{ marginLeft: 20 }}
            className="button is-primary"
            type="button"
            onClick={onStart}
          >
            <strong>Start</strong>
          </button>
          )}
          {isRunning && <Spinner />}
        </div>
        <FaChevronDown style={{ alignSelf: 'center', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </div>
      {
        expanded
        && (
        <div>
          {children}
        </div>
        )
      }
    </div>
  );
};

// function ExpandableListItem(props: Props): React.ReactElement {
//   const { title, children } = props;
//   console.log('world');

//   return (
// <div className="list-item">
//   <div style={{ flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
//     <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
//       <p style={{ fontWeight: 'bold' }}>{title}</p>
//       <button
//         style={{ marginLeft: 20 }}
//         className="button is-primary"
//         type="button"
//       >
//         <strong>Start</strong>
//       </button>
//     </div>
//     <FaChevronDown style={{ alignSelf: 'center' }} />
//   </div>
//   {children}
//   {/* <p>
//             The database has
//             {' '}
//             {struture.numExistingForeignKeys}
//             {' '}
//             Foreign keys and DBAnalyzer found
//             {' '}
//             {struture.numFoundForeignKeys}
//             {' '}
//             Potential Foreign Keys
//           </p> */}
// </div>
//   );
// }

export default ExpandableListItem;
