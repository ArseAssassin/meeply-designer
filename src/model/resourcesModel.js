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
                    body: value
                }))
            )
        )
    }
}))
