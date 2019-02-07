let { DEFAULT_PPI } = require('constants/units.js')

module.exports = [
    {
        name: 'Playing card',
        body: {
            width: 2.5,
            height: 3.5
        }
    },
    {
        name: 'Tile 1.5"',
        body: {
            width: 1.5,
            height: 1.5
        }
    },
    {
        name: 'Tile 2"',
        body: {
            width: 2,
            height: 2
        }
    },
    {
        name: 'Chit 1/2"',
        body: {
            width: .5,
            height: .5
        }
    },
    {
        name: 'A4',
        body: {
            width: 8.3,
            height: 11.7
        }
    }
].map((it) => ({
    ...it,
    body: r.mapObjIndexed((it) => it * DEFAULT_PPI, it.body)
}))
