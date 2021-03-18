import { l as cl, path, v as cv } from 'cchheess';
import { tt, mt } from 'chers';
import { Config } from './config';
import chers from 'chers';
import { ErrMap, codes } from './codes';
import { Sub, Sub2 } from './util';

const defaultMd = ``;

export default class Ctrl {

  onClick?: (fen: string) => void
  errs: ErrMap
  line: tt.Maybe<cl.Line>
  content: tt.Maybe<mt.Content>
  subContent = new Sub<tt.Maybe<mt.Content>>(() => this.content)
  subRecons = new Sub<void>(() => {})
  busHoverBoard = new Sub2<tt.Maybe<cv.MoveView>>()
  
  constructor(opts: Config) {

    this.onClick = opts.onClick;

    let md = opts.md ? opts.md : defaultMd;

    let mc = chers(md);
    this.content = mc;
    let _ = codes(mc);
    this.errs = _[0];
    this.line = _[1];
  }

  hover(view: cv.MoveView) {
    this.busHoverBoard.pub(view);
  }

  unHover() {
    this.busHoverBoard.pub(undefined);
  }

  click(view: cv.MoveView) {
    if (this.onClick) {
      this.onClick(view.fenAfter);
    }
  }
}
