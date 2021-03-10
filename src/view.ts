import { h, VNode } from 'hhh';
import { tt, mt } from 'chers';

function vDiv(): VNode {
  return h('div');
}

function vNewline({ newline }: mt.NewLine): VNode {
  return h('span.newline');
}

function vHeadline({ hline }: mt.HLine): VNode {
  return h('h2', hline);
}

function vText({ text }: mt.Text2): VNode {
  return h('span', text);
}

function vLine({ line }: mt.Line): VNode {
  return h('span.line', line);
}

function vFen({ fen }: mt.Fen): VNode {
  return h('span.fen', fen);
}

function vLineAndFen({ lineAndFen }: mt.LineAndFen): VNode {
  return h('linefen', [
    vLine(lineAndFen[0]), 
    vFen(lineAndFen[1])
  ]);
}

function plyToShowTurn(plyS: string): string {
  let ply = parseInt(plyS);

  if (ply % 2 === 0) {
    return ply / 2 + '.';
  } else {
    return (ply - 1) / 2 + '...';
  }
}

function vOneTurn({ oneturn } : mt.OneTurn): VNode {
  return h('strong.oneturn', plyToShowTurn(oneturn));
}

function vZeroTurn({ zeroturn } : mt.ZeroTurn): VNode {
  return h('strong.zeroturn', plyToShowTurn(zeroturn));
}

function vGlyphs({ moveGlyph, posGlyph, obsGlyph }: mt.MPOGlyphs): VNode {
  return h('span.glyphs');
}

function vSan(sanWithCastles: mt.SanWithCastles): VNode {
  
  if (typeof sanWithCastles === 'string') {
    return h('span.san', sanWithCastles);
  } else {
    return h('span.san', sanWithCastles.san);
  }
  
}

function vMove({ move }: mt.Move): VNode {
  return h('span.move',
           [vSan(move[0]),
            vGlyphs(move[1])]);
}

function vCMove({ cmove }: mt.ContinueMove): VNode {
  return h('span.cmove', [vOneTurn(cmove[0]),
                    vMove(cmove[1])]);
}

function vOneMove({ omove }: mt.OneMove): VNode {
  return h('span.omove', [
    vZeroTurn(omove[0]),
    vMove(omove[1])
  ]);
}

function vTwoMove({ tmove }: mt.TwoMove): VNode {
  return h('span.tmove', [
    vOneMove(tmove[0]),
    vMove(tmove[1])
  ]);
}

function vMoves({ continueMove, twoMoves, oneMove }: mt.Moves): VNode {
  let children = [];

  if (continueMove) {
    children.push(vCMove(continueMove));
  }

  if (twoMoves) {
    children = children
      .concat(twoMoves.map(vTwoMove))
  }

  if (oneMove) {
    children.push(vOneMove(oneMove));
  }

  return h('span', children);
}

function vLineAndMoves({ lineAndMoves }: mt.LineAndMoves): VNode {
  return h('lm', [
    vLine(lineAndMoves[0]),
    vMoves(lineAndMoves[1])
  ]);
}

function vLineLineMoves({ linelineMoves }: mt.LineLineMoves): VNode {
  return h('llm', [
    vLine(linelineMoves[0]),
    vLine(linelineMoves[1]),
    vMoves(linelineMoves[2])
  ]);
}

function vCode(code: mt.Code): VNode {
  if (mt.isLineAndFen(code)) {
    return vLineAndFen(code);
  } else if (mt.isLineLineMoves(code)) {
    return vLineLineMoves(code);
  } else {
    return vLineAndMoves(code);
  }
}

function vParagraph({ paragraph }: mt.Paragraph): VNode {

  let children = paragraph.map(_ => {
    if (mt.isText(_)) {
      return vText(_);
    } else {
      return vCode(_);
    }
  });

  return h('p', children);

}

function vContent({ content }: mt.Content): VNode {
  return h('div.content', content
    .map(_ => {
      if (mt.isNewline(_)) {
        return vNewline(_);
      } else if (mt.isHLine(_)) {
        return vHeadline(_);
      } else {
        return vParagraph(_);
      }
    }));
}


export default function(content: tt.Maybe<mt.Content>): VNode {

  let children: VNode;

  if (content) {
    children = vContent(content);
  } else {
    children = h('div.fail', 'Failed to load content.');
  }

  return h('div.escsh', children);
}
