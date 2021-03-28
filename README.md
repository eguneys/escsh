# Escsh

Converts Chers markup into html dom elements.
Shows chess notation along with visual chess boards, shows a chess board when hovered on notation.

`yarn install escsh --save`

```
    import escsh from 'escsh';

    escsh(document.body, {
        md: `# Hello this is Chers markup\nKings'gambit <initial 1. e4 e5 2. f4 exf4>`
    });
```
