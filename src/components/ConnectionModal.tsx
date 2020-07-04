import React from 'react';
import { observer } from 'mobx-react';
import TextField from './TextField';
import ConnectionStore from '../store/Connection';

interface Props {
  show: boolean,
  onClose: Function,
  onSave: Function,
  connection: ConnectionStore
 }

const ConnectionModal = observer(({
  show, onClose, connection, onSave,
} : Props) => {
  if (!show) {
    return null;
  }

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const testConnection = async () => {
    connection.testConnection();
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={handleClose} />
      <div className="modal-content">
        <div className="box">
          <p className="title">
            Add a new Connection
          </p>
          <TextField
            label="Server Label (optional)"
            placeholder="Server Label"
            value={connection.label}
            onChange={(text: string) => { connection.label = text; }}
          />
          <TextField
            label="Server Address"
            placeholder="Server Address"
            value={connection.server}
            onChange={(text: string) => { connection.server = text; }}
          />
          <TextField
            label="Database"
            placeholder="Database"
            value={connection.database}
            onChange={(text: string) => { connection.database = text; }}
          />
          <TextField
            label="Username"
            placeholder="Username"
            value={connection.username}
            onChange={(text: string) => { connection.username = text; }}
          />
          <TextField
            label="Password"
            placeholder="Password"
            value={connection.password}
            onChange={(text: string) => { connection.password = text; }}
          />

          <div className="field">
            <label className="label">DBMS</label>
            <div className="select">
              <select
                value={connection.dbms}
                onChange={(event) => { connection.dbms = event.target.value; }}
              >
                <option value="mysql">MYSQL</option>
                <option value="mssql">MS SQL</option>
              </select>
            </div>
          </div>
          <div className="field is-grouped">
            <div className="control">
              <button className="button" onClick={testConnection} type="button">Test</button>
            </div>
            <div className="control">
              <button className="button is-success" onClick={handleSave} type="button">Save</button>
            </div>
          </div>
          <p className="subtitle">{connection.status}</p>
        </div>
      </div>
      <button className="modal-close is-large" aria-label="close" type="button" onClick={handleClose} />
    </div>
  );
});

export default ConnectionModal;
