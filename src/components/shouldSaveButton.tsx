import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { FaRegCircle, FaRegCheckCircle } from 'react-icons/fa';
import { ShouldSave } from '../store/Table';

interface PropTypes {
  onChange: Function,
  shouldSave: any,
  style?: any
}

@observer
class ShouldSaveButton extends Component<PropTypes> {
  // constructor() {
  //   super();
  // }

  onChange = () => {
    const { onChange, shouldSave } = this.props;
    if (onChange) {
      switch (shouldSave) {
        case ShouldSave.Undecided:
          onChange(ShouldSave.Yes);
          break;
        case ShouldSave.Yes:
          onChange(ShouldSave.No);
          break;
        case ShouldSave.No:
          onChange(ShouldSave.Undecided);
          break;
        default:
      }
    } else {
      // console.log('BUtotn changed but missing onChange props');
    }
  };

  render() {
    const { shouldSave, style } = this.props;
    // console.log(this.props.shouldSave);
    switch (shouldSave) {
      case ShouldSave.No:
        return <FaRegCircle style={{ color: 'red', ...style }} onClick={this.onChange} />;
      case ShouldSave.Undecided:
        return (
          <FaRegCheckCircle
            style={{ color: 'gold', ...style }}
            onClick={this.onChange}
          />
        );
      case ShouldSave.Yes:
        return (
          <FaRegCheckCircle
            style={{ color: 'green', ...style }}
            onClick={this.onChange}
          />
        );
      default:
        return null;
    }
  }
}

export default ShouldSaveButton;
