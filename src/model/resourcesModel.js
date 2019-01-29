let files = ((ctx) => {
        let keys = ctx.keys()
        let values = keys.map(ctx)

        return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {})
    })(require.context('../../assets/Fractal Symbols/', true, /.svg$/))

module.exports = switchboard.model(({ signal }) => ({
    images: {
        signal: signal(
            threadLast(files)(
                r.toPairs,
                r.map(([key, value]) => ({
                    name: r.last(key.split('/')),
                    body: value,
                    license:
                        <Type modifiers='xs'><a href='http://afractalthought.com/fractal-symbols/board-game-library/' target='_blank'>Fractal Symbols</a> by Felix Thålin. Licensed under <a href='https://creativecommons.org/licenses/by/4.0/' target='_blank'>Creative Commons Attrubution 4.0 International</a> license.</Type>
                }))
            )
        )
    }
}))
