import { h, init } from 'hhh';
import chers from 'chers';

import view from './view';

type Config = {
  md?: string
}

export default function app(element: Element, opts: Config) {

  let recons = init();

  let { md } = opts;
  
  if (md) {
    let mc = chers(md);

    let vnode = view(mc);

    let $_ = recons(vnode);

    element.appendChild($_);
  }
  
}
