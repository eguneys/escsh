import { default as chers, tt, mt } from 'chers';
import { Config } from './config';
import { Sub } from 'uuu';
import { line } from 'enil';

export type Hover<A> = {
  active: boolean,
  hover?: A
}

export default class Ctrl {

  onClick?: (fen: string) => void
  content: Sub<tt.Maybe<mt.Content>>;
  hoverBoard: Sub<Hover<line.MoveView>>;
  
  constructor(opts: Config) {
    this.onClick = opts.onClick;

    let md = opts.md || ``;

    let mc = chers(md);
    this.content = new Sub<tt.Maybe<mt.Content>>(mc);
    this.hoverBoard = new Sub<Hover<line.MoveView>>({active: false});
  }

  trigger() {
    this.content.pub();
  }

  hover(hover: line.MoveView) {
    this.hoverBoard.pub({active: true, hover});
  }

  unHover() {
    this.hoverBoard.pub({active: false});
  }

  click(view: line.MoveView) {
    if (this.onClick) {
      this.onClick(view.after.fen);
    }
  }
}
