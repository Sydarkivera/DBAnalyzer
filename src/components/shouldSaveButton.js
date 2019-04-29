import React, { Component } from "react";
import { observer } from "mobx-react";
import { FaRegCircle, FaRegCheckCircle } from "react-icons/fa";

@observer
class ShouldSaveButton extends Component {
  // constructor() {
  //   super();
  // }

  onChange = () => {
    if (this.props.onChange) {
      switch (this.props.shouldSave) {
        case false:
        case 0:
          this.props.onChange(1);
          break;
        case true:
        case 1:
          this.props.onChange(2);
          break;
        case 2:
          this.props.onChange(0);
          break;
        default:
      }
    } else {
      console.log("BUtotn changed but missing onChange props");
    }
  };

  render() {
    console.log(this.props.shouldSave);
    switch (this.props.shouldSave) {
      case false:
      case 0:
        return <FaRegCircle style={{ color: "red" }} onClick={this.onChange} />;
      case true:
      case 1:
        return (
          <FaRegCheckCircle
            style={{ color: "yellow" }}
            onClick={this.onChange}
          />
        );
      case 2:
        return (
          <FaRegCheckCircle
            style={{ color: "green" }}
            onClick={this.onChange}
          />
        );
      default:
        return null;
    }
  }
}

export default ShouldSaveButton;
