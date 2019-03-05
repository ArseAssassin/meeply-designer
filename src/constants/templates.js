let { DEFAULT_PPI } = require('constants/units.js')

module.exports = [
    {
        name: 'Playing card',
        body: {
            shape: 'roundedRect',
            width: 2.5,
            height: 3.5
        }
    },
    {
        name: 'Tile 1.5"',
        body: {
            shape: 'rect',
            width: 1.5,
            height: 1.5
        }
    },
    {
        name: 'Tile 2"',
        body: {
            shape: 'rect',
            width: 2,
            height: 2
        }
    },
    {
        name: 'Hexagon tile 3"',
        body: {
            shape: 'hexagon',
            width: 3.44,
            height: 3,
        }
    },
    {
        name: 'Chit 1/2"',
        body: {
            shape: 'ellipse',
            width: .5,
            height: .5
        }
    },
    {
        name: 'A4',
        body: {
            shape: 'rect',
            width: 8.3,
            height: 11.7
        }
    },
    {
        name: 'Letter',
        body: {
            shape: 'rect',
            width: 8.5,
            height: 11
        }
    }
].map((it) => ({
    ...it,
    body: { ...it.body, width: it.body.width * DEFAULT_PPI, height: it.body.height * DEFAULT_PPI }
}))
