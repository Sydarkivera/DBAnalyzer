import {
  observable, reaction, computed, IReactionDisposer, action,
} from 'mobx';
import { v4 as uuid } from 'uuid';

interface ErrorStruct {
  title: string,
  body?: string,
  id: string
}

export default class ErrorStore {
  @observable errors: ErrorStruct[] = [];

  @action add(title: string, body?: string) {
    this.errors.push({ title, id: uuid(), body });
  }

  @action remove(id: string) {
    this.errors = this.errors.filter((item) => item.id !== id);
  }
}
