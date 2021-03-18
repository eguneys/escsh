import { tt, mt } from 'chers';

import { h, init } from 'hhh';

import { Config } from './config';
import View from './view';
import Ctrl from './ctrl';

export default function app(element: Element, opts: Config) {

  let recons = init();

  let ctrl = new Ctrl(opts);

  ctrl.subContent.sub(content => {
    let view = new View(ctrl, content);
    let $_ = recons(view.v$_);
    ctrl.subRecons.trigger();
    element.appendChild($_);
  });

  ctrl.subContent.trigger();
  
}
