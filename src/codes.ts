import { tt, mt } from 'chers';
import { ct, l, f, path } from 'cchheess';

export type ErrMap = Map<ct.Ply, l.LineError | path.MakesError>

export function codes(mcontent: tt.Maybe<mt.Content>): [ErrMap, tt.Maybe<l.Line>] {

  let errs: ErrMap = new Map();
  let line: tt.Maybe<l.Line>;

  function codeFen(fen: string, lineS: string) {
    let situation = f.situation(fen);
    if (situation) {
      line = new l.Line(lineS, situation);
    }
  }
  function codeMove(ply: number, move: mt.Move, lineS: string, line2S?: string) {
    let { move: [_sanwc, glyphs] } = move;
    let sanwc = typeof _sanwc === 'string' ? _sanwc : _sanwc.san;

    if (line) {
      if (line2S) {
        let err = line.move2(lineS, line2S, sanwc, ply);
        if (err) {
          errs.set(ply, err);
        }
      } else {
        let err = line.move(lineS, sanwc, ply);
        if (err) {
          errs.set(ply, err);
        }0
      }
    }
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

  
  if (mcontent) {
    let { content } = mcontent;

    let res = content.forEach(content => {

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
  }

  return [errs, line]; 
}
