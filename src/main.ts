import { h, init } from 'hhh';
import chers from 'chers';

import View from './view';
import codes from './codes';

type Config = {
  md?: string
}

export default function app(element: Element, opts: Config) {

  let recons = init();

  let { md } = opts;
  
  if (md) {
    let mc = chers(md);

    let view = new View(codes(mc));

    let vnode = view.vMContent(mc);

    let $_ = recons(vnode);

    element.appendChild($_);
  }
  
}
