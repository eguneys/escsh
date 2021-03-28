import { tt, mt } from 'chers';
import { line } from 'enil';

export function codes(mcontent: mt.Content) {

  let builder = new line.Builder();

  function codeFen(fen: string, lineS: string) {
    builder.fen(lineS, fen);
  }
  function codeMove(ply: number, move: mt.Move, lineS: string, line2S?: string) {
    let { move: [_sanwc, glyphs] } = move;
    let sanwc = typeof _sanwc === 'string' ? _sanwc : _sanwc.san;

    builder.line(lineS, ply, sanwc, line2S);
  }

  function codeMoves({ continueMove, twoMoves, oneMove }: mt.Moves, lineS: string, line2S?: string) {
    let useLine2SOnce = line2S;

    if (continueMove) {
      let { cmove } = continueMove;
      let [{oneturn},move] = cmove;
      codeMove(parseInt(oneturn), move, lineS, useLine2SOnce);
      useLine2SOnce = undefined;
    }
    if (twoMoves) {
      twoMoves.forEach(({tmove}) => {

        let [{omove}, move] = tmove;
        let [{zeroturn}, move2] = omove;
        codeMove(parseInt(zeroturn), move2, lineS, useLine2SOnce);
        useLine2SOnce = undefined;
        codeMove(parseInt(zeroturn)+1, move, lineS);

      });
    }

    if (oneMove) {
      let { omove } = oneMove;
      let [{zeroturn},move] = omove;
      codeMove(parseInt(zeroturn), move, lineS);
    }
  }

  
  let { content } = mcontent;

  content.forEach(content => {

    if (mt.isParagraph(content)) {
      let { paragraph } = content;
      paragraph.forEach(tOrC => {
        if (mt.isLineAndFen(tOrC)) {
          let { lineAndFen: [{line}, {fen}] } = tOrC;
          codeFen(fen, line);
        } else if (mt.isLineLineMoves(tOrC)) {
          let { linelineMoves: [{line},
                                {line: line2},moves]} = tOrC;

          codeMoves(moves, line, line2);
          
        } else if (mt.isLineAndMoves(tOrC)) {
          let { lineAndMoves: [{line}, moves] } = tOrC;
          codeMoves(moves, line);
        }
      });
    }
  });

  builder.build();
  return builder;
}
