import { l as cl, path } from 'cchheess';
import { h, VNode } from 'hhh';
import { tt, mt } from 'chers';
import * as codes from './codes';
import Ctrl from './ctrl';
import { Sub } from './util';
import ssehC from 'ssehc';

type LineAndParent = [mt.Line] | [mt.Line, mt.Line]

export function fTranslateAbs(elm: HTMLElement, pos: [number, number]) {
  elm.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
}

function isInViewport(bounds: ClientRect) {
  return bounds.top >= 0 &&
    bounds.left >= 0 &&
    bounds.bottom <= window.innerHeight &&
    bounds.right <= window.innerWidth;
}

function listenEndScroll(onEndScroll: () => void) {
  let isScrolling: number;
  document.addEventListener('scroll', function(event) {
    clearTimeout(isScrolling);
    isScrolling = window.setTimeout(() => onEndScroll(), 60);
  }, false);
}

export default class View {

  v$_!: VNode
  v$hoverBoard!: VNode
  vs$board: VNode[]
  v$visibleBoard!: tt.Maybe<VNode>
  ctrl: Ctrl

  constructor(ctrl: Ctrl, content: tt.Maybe<mt.Content>){
    this.ctrl = ctrl;
    this.vs$board = [];
    this.vMContent(content);

    this.ctrl.subRecons.sub(() => {
      listenEndScroll(this.findVisiblePly.bind(this));
      this.findVisiblePly();
    });
  }

  findVisiblePly() {
    this.v$visibleBoard = this.vs$board
      .find(_ =>
        isInViewport((_.elm as HTMLElement).getBoundingClientRect()));
  }

  vDiv(): VNode {
    return h('div');
  }

  vNewline({ newline }: mt.NewLine): VNode {
    return h('span.newline');
  }

  vHeadline({ hline }: mt.HLine): VNode {
    return h('h2', hline);
  }

  vText({ text }: mt.Text2): VNode {
    return h('span', text);
  }

  vLine({ line }: mt.Line): VNode {
    return h('span.line', line);
  }

  vFen({ fen }: mt.Fen): VNode {
    return h('span.fen', fen);
  }

  vLineAndFen({ lineAndFen }: mt.LineAndFen): Array<VNode> {
    return [this.vFen(lineAndFen[1])];
  }

  // 1 1, 2 1, 3 2 4 2,
  plyToShowTurn(plyS: string): string {
    let ply = parseInt(plyS);
    return Math.ceil(ply / 2) + (ply% 2 === 1 ? '.' : '...');
  }

  vOneTurn({ oneturn } : mt.OneTurn): VNode {
    return h('strong.oneturn', this.plyToShowTurn(oneturn));
  }

  vZeroTurn({ zeroturn } : mt.ZeroTurn): VNode {
    return h('strong.zeroturn', this.plyToShowTurn(zeroturn));
  }

  vGlyphs({ moveGlyph, posGlyph, obsGlyph }: mt.MPOGlyphs): VNode {
    return h('span.glyphs');
  }

  vSan(sanWithCastles: mt.SanWithCastles): VNode {
    if (typeof sanWithCastles === 'string') {
      return this.vSanString(sanWithCastles);
    } else {
      return this.vSanString(sanWithCastles.san);
    }
  }

  vSanString(san: string): VNode {
    return h('span.san', san);
  }

  vMove(ply: number, { move }: mt.Move, lp: LineAndParent): VNode {
    let bn = this.ctrl.line?.ply(lp[0].line, ply);
    let err = this.ctrl.errs.get(ply);

    if (!bn) {
      let _err = err ? err : 'No initial situation';
      return h('span.move', {
               attrs: {
                 'data-error': _err,
                 'title': _err
               }
      },
               [this.vSan(move[0]),
                this.vGlyphs(move[1])]);      
    }

    if (path.isMakesError(bn)) {
      if (!err) {
        err = bn;
      }
      return h('span.move', {
        attrs: {
          'data-error': err,
          'title': err
        }
      },
               [this.vSan(move[0]),
                this.vGlyphs(move[1])]);

    } else {
      let v$res = h('span.move',
                  [this.vSanString(bn.view.san),
                   this.vGlyphs(move[1])]);

      let moveView = bn.view;

      this.ctrl.subRecons.sub(() => {
        let $res = v$res.elm as HTMLElement,
        $hoverBoard = this.v$hoverBoard.elm as HTMLElement,
        $_ = this.v$_.elm as HTMLElement;

        ['mouseover', 'touchstart'].forEach(_ => {
          $res.addEventListener(_, () => {

            let posToTranslate: [number, number] = 
              [window.pageXOffset, window.pageYOffset];

            if (this.v$visibleBoard) {
              let bounds = (this.v$visibleBoard.elm as HTMLElement)
                             .getBoundingClientRect();
              posToTranslate[0] += bounds.left;
              posToTranslate[1] += bounds.top;
            } else {
              let { clientWidth } = $_;

              let offBounds = $res.getBoundingClientRect();
              let helBounds = $hoverBoard.getBoundingClientRect();

              if (offBounds.left < clientWidth / 2) {
                posToTranslate[0] += clientWidth - helBounds.width - 4;
              }
            }

            fTranslateAbs($hoverBoard, posToTranslate);
            
            this.ctrl.hover(moveView);
            
          });
        });
        ['mouseleave', 'touchend'].forEach(_ => {
          $res.addEventListener(_, () => {
            this.ctrl.unHover();
          });
        });

        $res.addEventListener('click', () => {
          this.ctrl.click(moveView);
        });

      });

      return v$res;
    }
  }

  vCMove({ cmove }: mt.ContinueMove, lp: LineAndParent): VNode {
    return h('span.cmove', [this.vOneTurn(cmove[0]),
                            this.vMove(oTurn2Ply(cmove[0]), cmove[1], lp)]);
  }

  vOneMove({ omove }: mt.OneMove, lp: LineAndParent): VNode {
    return h('span.omove', [
      this.vZeroTurn(omove[0]),
      this.vMove(zTurn2Ply(omove[0]), omove[1], lp)
    ]);
  }

  vTwoMove({ tmove }: mt.TwoMove, lp: LineAndParent): VNode {
    return h('span.tmove', [
      this.vOneMove(tmove[0], lp),
      this.vMove(zTurn2Ply(tmove[0].omove[0]) + 1, tmove[1], lp)
    ]);
  }

  vMoves({ continueMove, twoMoves, oneMove }: mt.Moves, 
         line: mt.Line,
         pline?: mt.Line): Array<VNode> {

    let lp: LineAndParent = pline ? [line, pline] : [line];

    let children = [];

    if (continueMove) {
      children.push(this.vCMove(continueMove, lp));
    }

    if (twoMoves) {
      children = children
        .concat(twoMoves.map(_ => this.vTwoMove(_, lp)))
    }

    if (oneMove) {
      children.push(this.vOneMove(oneMove, lp));
    }

    return children;
  }

  vLineAndMoves({ lineAndMoves }: mt.LineAndMoves): Array<VNode> {
    return this.vMoves(lineAndMoves[1], lineAndMoves[0]);
  }

  vLineLineMoves({ linelineMoves }: mt.LineLineMoves): Array<VNode> {
    return this.vMoves(linelineMoves[2], linelineMoves[0], linelineMoves[1])
  }

  vCode(code: mt.Code): Array<VNode> {
    if (mt.isLineAndFen(code)) {
      return this.vLineAndFen(code);
    } else if (mt.isLineLineMoves(code)) {
      return this.vLineLineMoves(code);
    } else {
      return this.vLineAndMoves(code);
    }
  }

  vParagraph({ paragraph }: mt.Paragraph): VNode {

    let children = paragraph.flatMap(_ => {
      if (mt.isText(_)) {
        return this.vText(_);
      } else {
        return this.vCode(_).flatMap(_ => [_, ' ']) as VNode[];
      }
    });

    return h('p', children);

  }

  vBoard({ board: [{line}, ply] }: mt.Board): VNode {
    let bn = this.ctrl.line?.ply(line, ply);
    let fen: tt.Maybe<string>,
    lastMove: tt.Maybe<string>;
    if (bn && !path.isMakesError(bn)) {
      fen = bn.view.fenAfter;
      lastMove = bn.view.uci;
    }

    let vBoard = h('div.board');

    this.ctrl.subRecons.sub(() => {
      ssehC(vBoard.elm as Element, {
        fen,
        lastMove
      });
    });

    this.vs$board.push(vBoard);

    return vBoard;
  }

  vContent({ content }: mt.Content): VNode {
    return h('div.content', content
      .map(_ => {
        if (mt.isNewline(_)) {
          return this.vNewline(_);
        } else if (mt.isHLine(_)) {
          return this.vHeadline(_);
        } else if (mt.isParagraph(_)) {
          return this.vParagraph(_);
        } else {
          return this.vBoard(_);
        }
      }));
  }

  vHover() {
    let hply = h('div.hover-board', [])

    this.v$hoverBoard = hply;

    this.ctrl.subRecons.sub(() => {
      ssehC(hply.elm as Element, {});
      (hply.elm as Element).classList.add('hidden');
    });

    this.ctrl.busHoverBoard.sub((moveView) => {
      let $eply = (hply.elm as HTMLElement);
      if (moveView) {
        while ($eply.lastElementChild) {
          $eply.removeChild($eply.lastElementChild);
        }
        ssehC($eply, { fen: moveView.fenAfter, lastMove: moveView.uci });

        $eply.classList.remove('hidden');
      } else {
        $eply.classList.add('hidden');
      }
    });

    return hply;
  }


  vMContent(content: tt.Maybe<mt.Content>): VNode {

    let children: VNode[];

    if (content) {
      children = [
        this.vContent(content),
        this.vHover()
      ];
    } else {
      children = [h('div.fail', 'Failed to load content.')];
    }

    this.v$_ = h('div.escsh', children);

    return this.v$_;
  }

}

function zTurn2Ply({ zeroturn }: mt.ZeroTurn) {
  return parseInt(zeroturn);
}

function oTurn2Ply({ oneturn }: mt.OneTurn) {
  return parseInt(oneturn);
}
