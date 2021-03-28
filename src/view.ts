import { h, vh, vmap, vex, VHNode } from 'hhh';
import { tt, mt } from 'chers';
import { codes } from './codes';
import { line } from 'enil';
import Ctrl from './ctrl';
import { Sub } from 'uuu';
import { default as ssehC, api as ssehCApi } from 'ssehc';

type LineAndParent = [mt.Line] | [mt.Line, mt.Line]

type EPos = [number, number];

function fTranslateAbs(elm: HTMLElement, pos: EPos) {
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

type BoardInViewport = {
  $board?: Node
}

export default class View {

  ctrl: Ctrl
  builderOnContent!: line.Builder
  hPosToTranslate: Sub<EPos>
  hBounds: Sub<ClientRect>
  clientWidth: Sub<number>
  board$InViewport: Sub<BoardInViewport>

  constructor(ctrl: Ctrl){
    this.ctrl = ctrl;

    let crect = document.body.getBoundingClientRect();
    this.hPosToTranslate = new Sub<EPos>([-1000, -1000] as EPos);
    this.hBounds = new Sub<ClientRect>(crect);
    this.clientWidth = new Sub<number>(0);
    this.board$InViewport = new Sub<BoardInViewport>({});
  }


  vDiv(): VHNode {
    return h('div');
  }

  vNewline({ newline }: mt.NewLine): VHNode {
    return h('span.newline');
  }

  vHeadline({ hline }: mt.HLine): VHNode {
    return h('h2', hline);
  }

  vText({ text }: mt.Text2): VHNode {
    return h('span', text);
  }

  vLine({ line }: mt.Line): VHNode {
    return h('span.line', line);
  }

  vFen({ fen }: mt.Fen): VHNode {
    return h('span.fen', fen);
  }

  vLineAndFen({ lineAndFen }: mt.LineAndFen): Array<VHNode> {
    return [this.vFen(lineAndFen[1])];
  }

  // 1 1, 2 1, 3 2 4 2,
  plyToShowTurn(plyS: string): string {
    let ply = parseInt(plyS);
    return Math.ceil(ply / 2) + (ply% 2 === 1 ? '.' : '...');
  }

  vOneTurn({ oneturn } : mt.OneTurn): VHNode {
    return h('strong.oneturn', this.plyToShowTurn(oneturn));
  }

  vZeroTurn({ zeroturn } : mt.ZeroTurn): VHNode {
    return h('strong.zeroturn', this.plyToShowTurn(zeroturn));
  }

  vGlyphs({ moveGlyph, posGlyph, obsGlyph }: mt.MPOGlyphs): VHNode {
    return h('span.glyphs');
  }

  vSan(sanWithCastles: mt.SanWithCastles): VHNode {
    if (typeof sanWithCastles === 'string') {
      return this.vSanString(sanWithCastles);
    } else {
      return this.vSanString(sanWithCastles.san);
    }
  }

  vSanString(san: string): VHNode {
    return h('span.san', san);
  }

  vCMove({ cmove }: mt.ContinueMove, lp: LineAndParent): VHNode {
    return h('span.cmove', [this.vOneTurn(cmove[0]),
                            this.vMove(oTurn2Ply(cmove[0]), cmove[1], lp)]);
  }

  vOneMove({ omove }: mt.OneMove, lp: LineAndParent): VHNode {
    return h('span.omove', [
      this.vZeroTurn(omove[0]),
      this.vMove(zTurn2Ply(omove[0]), omove[1], lp)
    ]);
  }

  vTwoMove({ tmove }: mt.TwoMove, lp: LineAndParent): VHNode {
    return h('span.tmove', [
      this.vOneMove(tmove[0], lp),
      this.vMove(zTurn2Ply(tmove[0].omove[0]) + 1, tmove[1], lp)
    ]);
  }

  vMoves({ continueMove, twoMoves, oneMove }: mt.Moves, 
         line: mt.Line,
         pline?: mt.Line): Array<VHNode> {

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

  vLineAndMoves({ lineAndMoves }: mt.LineAndMoves): Array<VHNode> {
    return this.vMoves(lineAndMoves[1], lineAndMoves[0]);
  }

  vLineLineMoves({ linelineMoves }: mt.LineLineMoves): Array<VHNode> {
    return this.vMoves(linelineMoves[2], linelineMoves[0], linelineMoves[1])
  }

  vCode(code: mt.Code): Array<VHNode> {
    if (mt.isLineAndFen(code)) {
      return this.vLineAndFen(code);
    } else if (mt.isLineLineMoves(code)) {
      return this.vLineLineMoves(code);
    } else {
      return this.vLineAndMoves(code);
    }
  }

  vParagraph({ paragraph }: mt.Paragraph): VHNode {

    let children = paragraph.flatMap(_ => {
      if (mt.isText(_)) {
        return this.vText(_);
      } else {
        return this.vCode(_).flatMap(_ => [_, ' ']);
      }
    });

    return h('p', children);

  }

  vBoard({ board: [{line}, ply] }: mt.Board) {

    let _fen: string,
    _lastMove: string;

    if (ply === '0') {
      let view = this.builderOnContent.zeroPly(line);

      if (view) {
        _fen = view.fen;
      }
    } else {
      let view = this.builderOnContent.plyMove(line, parseInt(ply));

      if (view) {
        _fen = view.after.fen;
        _lastMove = view.san;
      }
    }

    const bindBoardListeners = (_$: Node) => {
      const findInViewport = () => {
        let bounds = (_$ as Element).getBoundingClientRect();
        if (isInViewport(bounds)) {
          this.board$InViewport.pub({
            $board: _$
          });
        } else {
          if (this.board$InViewport.currentValue.$board === _$) {
            this.board$InViewport.pub({});
          }
        }
      }
      listenEndScroll(findInViewport);


      return findInViewport;
    }

    let boundListeners: any;

    let vBoard = vh('div.board', {}, {
      resize: (bounds, _$) => {
        if (!boundListeners) {
          boundListeners = bindBoardListeners(_$);
        }
        boundListeners();
      },
      element: () => (_$: Node) => {
        ssehC(_$ as Element, {
          fen: _fen,
          lastMove: _lastMove
        });
      }
    }, []);

    return vBoard;
  }

  vContent(mcontent: mt.Content) {
    this.builderOnContent = codes(mcontent);

    return h('div.content', mcontent.content
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


  addListenersVMove(_$: Element, __move: line.MoveView, ctx: any) {
    ['mouseover', 'touchstart'].forEach(_ => {
      _$.addEventListener(_, () => {

        let posToTranslate: [number, number] = 
          [window.pageXOffset, window.pageYOffset];

        if (ctx.board$InViewport) {
          let bounds = ctx.board$InViewport.getBoundingClientRect();
          posToTranslate[0] += bounds.left;
          posToTranslate[1] += bounds.top;
        } else {
          let { clientWidth } = ctx;

          let offBounds = _$.getBoundingClientRect();
          if (offBounds.left < clientWidth / 2) {
            posToTranslate[0] += clientWidth - ctx.hBounds.width - 4;
          }
        }

        this.hPosToTranslate.pub(posToTranslate);

        this.ctrl.hover(__move);
      });
    });
    
    ['mouseleave', 'touchend'].forEach(_ => {
      _$.addEventListener(_, () => {
        this.ctrl.unHover();
      });
    });
    

    _$.addEventListener('click', () => {
      this.ctrl.click(__move);
    })

    return (_ctx: any) => {
      ctx = _ctx;
    };
  }

  vMove(ply: number, { move }: mt.Move, lp: LineAndParent): VHNode {
    let _move = this.builderOnContent.plyMove(lp[0].line, ply);
    let errs = this.builderOnContent.plyErr(lp[0].line, ply);

    const attributes = () => {
      let res: any = {};

      if (errs.length > 0) {
        res['data-error'] = errs[0];
        res['title'] = errs[0];
      }

      return res;
    };

    if (_move) {
      let listenersUpdateCtx: (_: any) => void;

      let __move = _move;
      let v$move = vh('span.move', {}, {
        attrs: (props) => (attributes()),
        element: (props) => (elm: Node) => {
          let _$: Element = elm as Element;
          if (!listenersUpdateCtx) {
            listenersUpdateCtx = this.addListenersVMove(_$, __move, props);
          } else {
            listenersUpdateCtx(props);
          }

        }
      },
                [this.vSanString(_move.san),
                 this.vGlyphs(move[1])]);

      let ctx: any = {}

      this.board$InViewport.sub(board$InViewport => {
        ctx.board$InViewport = board$InViewport.$board;
        v$move.updateParentProp(ctx);
      });

      this.hBounds.sub(hBounds => {
        ctx.hBounds = hBounds; 
        v$move.updateParentProp(ctx)
      });
      this.clientWidth.sub(clientWidth => {
        ctx.clientWidth = clientWidth;
        v$move.updateParentProp(ctx)
      });

      return v$move;

    } else {
      return vh('span.move', {}, {
        attrs: (props) => (attributes()),
      }, [this.vSan(move[0]),
          this.vGlyphs(move[1])]);               
    }
  }

  vHover() {
    let ssApi: ssehCApi | undefined;

    let v$h = vh('div.hover-board', {}, {
      resize: (rect) => this.hBounds.pub(rect),
      klassList: ({ active }) => active?[]:['hidden'],
      element: ({ active, hover, posToTranslate }) => (elm: Node) => {
        let _elm: Element = elm as Element;
        fTranslateAbs(_elm as HTMLElement, posToTranslate);
        if (active) {
          if (ssApi) {
            ssApi.fen(hover.after.fen);
            ssApi.lastMove(hover.uci);
          } else {
            ssApi = ssehC(_elm, { 
              fen: hover.after.fen,
              lastMove: hover.uci
            });
          }
        }
      }
    }, [], { posToTranslate: [-1000, -1000] });

    this.ctrl.hoverBoard.sub(_ => v$h.update(_));

    this.hPosToTranslate.sub(posToTranslate => v$h.updateParentProp({posToTranslate}));

    return v$h;
  }


  vApp() {

    let v$children = vex([]);

    this.ctrl.content.sub(mcontent => {
      let children = [];
      if (mcontent) {
        children = [
          this.vContent(mcontent),
          this.vHover()
        ];
      } else {
        children = [h('div.fail', 'Failed to load content.')];
      }
      
      v$children.replace(children);
    });


    return vh('div.escsh', {}, {
      resize: (rect) => this.clientWidth.pub(rect.width)
    }, [v$children]);
  }

}

function zTurn2Ply({ zeroturn }: mt.ZeroTurn) {
  return parseInt(zeroturn);
}

function oTurn2Ply({ oneturn }: mt.OneTurn) {
  return parseInt(oneturn);
}
