import { tt, mt } from 'chers';

import { h, vinit } from 'hhh';

import { Config } from './config';
import View from './view';
import Ctrl from './ctrl';

export default function app(element: Element, opts: Config) {

  let recons = vinit();

  let ctrl = new Ctrl(opts);

  let view = new View(ctrl);
  let $_ = recons(view.vApp());
  
  ctrl.trigger();
  element.appendChild($_);
}
