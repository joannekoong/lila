/// <reference types="types/lichess" />
/// <reference types="types/mithril" />

import * as m from 'mithril';
import throttle from './throttle';

export function defined(v: any): boolean {
  return typeof v !== 'undefined';
}

export function empty(a: any): boolean {
  return !a || a.length === 0;
}

export interface ClassSet {
  [klass: string]: boolean;
}

export function classSet(classes: ClassSet): string {
  const arr = [];
  for (const i in classes) {
    if (classes[i]) arr.push(i);
  }
  return arr.join(' ');
}

export interface StoredProp<T> {
  (): string;
  (v: T): void;
}

export interface StoredBooleanProp {
  (): boolean;
  (v: boolean): void;
}

export function storedProp(k: string, defaultValue: boolean): StoredBooleanProp;
export function storedProp<T>(k: string, defaultValue: T): StoredProp<T>;
export function storedProp(k: string, defaultValue: any) {
  const sk = 'analyse.' + k;
  const isBoolean = defaultValue === true || defaultValue === false;
  var value: any;
  return function(v: any) {
    if (defined(v) && v != value) {
      value = v + '';
      window.lichess.storage.set(sk, v);
    } else if (!defined(value)) {
      value = window.lichess.storage.get(sk);
      if (value === null) value = defaultValue + '';
    }
    return isBoolean ? value === 'true' : value;
  };
}

export interface StoredJsonProp<T> {
  (): T;
  (v: T): void;
}

export function storedJsonProp<T>(keySuffix: string, defaultValue: T): StoredJsonProp<T> {
  const key = 'explorer.' + keySuffix;
  return function() {
    if (arguments.length) window.lichess.storage.set(key, JSON.stringify(arguments[0]));
    const ret = JSON.parse(window.lichess.storage.get(key));
    return (ret !== null) ? ret : defaultValue;
  };
}

export function bindOnce(eventName: string, f: (e: Event) => void): Mithril.Config {
  const withRedraw = function(e: Event) {
    m.startComputation();
    f(e);
    m.endComputation();
  };
  return function(el: Element, isUpdate: boolean, ctx: any) {
    if (isUpdate) return;
    el.addEventListener(eventName, withRedraw)
    ctx.onunload = function() {
      el.removeEventListener(eventName, withRedraw);
    };
  }
}

export { throttle };

export type F = () => void;

export function dropThrottle(delay: number): (f: F) => void  {
  var task: F | undefined;
  const run = function(f: F) {
    task = f;
    f();
    setTimeout(function() {
      if (task !== f) run(task!);
      else task = undefined;
    }, delay);
  };
  return function(f) {
    if (task) task = f;
    else run(f);
  };
}
