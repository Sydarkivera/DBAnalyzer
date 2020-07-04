import React, { ChangeEvent } from 'react';

interface Props {
  label: string,
  placeholder: string,
  onChange: Function,
  value: string
 }

const TextField = ({
  label, placeholder, onChange, value,
}: Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="control">
        <input
          className="input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default TextField;
