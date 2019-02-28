let fractalFiles =
        ((ctx) => {
            let keys = ctx.keys()
            let values = keys.map(ctx)

            return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {})
        })(require.context('../../assets/Fractal Symbols/', true, /.svg$/)),
    gameIconsFiles =
        ((ctx) => {
            let keys = ctx.keys()
            let values = keys.map(ctx)

            return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {})
        })(require.context('../../assets/game-icons-net/', true, /.svg$/))

let persistentSignal = require('model/persistentSignal.js')


module.exports = switchboard.model(({ signal, slot }) => {
    let library =
            threadLast(fractalFiles)(
                r.toPairs,
                r.map(([key, value]) => ([key, {
                    name: r.last(key.split('/')),
                    id: key,
                    body: value,
                    license:
                        <Type modifiers='xs'><a rel='noopener noreferrer' href='http://afractalthought.com/fractal-symbols/board-game-library/' target='_blank'>Fractal Symbols</a> by Felix Thålin. Licensed under <a rel='noopener noreferrer' href='https://creativecommons.org/licenses/by/4.0/' target='_blank'>Creative Commons Attrubution 4.0 International</a> license.</Type>,
                    source: 'Fractal Icons'
                }])),
                r.concat(threadLast(gameIconsFiles)(
                    r.toPairs,
                    r.map(([key, value]) => ([key, {
                        name: r.last(key.split('/')),
                        id: key,
                        body: value,
                        license:
                            <Type modifiers='xs'><a rel='noopener noreferrer' href='https://game-icons.net/' target='_blank'>Game Icons</a> by <a href='http://lorcblog.blogspot.com/'>Lorc</a>, <a href='http://delapouite.com/'>Delapouite</a> & <a href='https://game-icons.net/about.html#authors'>contributors</a>. Licensed under <a rel='noopener noreferrer' href='http://creativecommons.org/licenses/by/3.0/' target='_blank'>Creative Commons Attribution 3.0 Unported</a> license.</Type>,
                        source: 'game-icons.net'
                    }]))
                )),
                r.fromPairs,
                (it) => kefir.constant(it)
            ),

        userImages =
            persistentSignal(signal)(
                'project-userImages',

                {},

                slot('userImages.upload'),
                (it, { name, body, id }) => {
                    return ({
                        ...it,
                        [id]: {
                            name,
                            body,
                            id
                        }
                    })
                },

                slot('userImages.update'),
                (it, [id, body]) => ({
                    ...it,
                    [id]: {
                        ...it[id],
                        ...body
                    }
                }),

                slot('userImages.set'),

                slot('userImages.delete'),
                (it, id) => r.dissoc(id, it)
            ),
        allImages =
            kefir.combine(
                [userImages, library]
            )
            .toProperty()
            .map(r.apply(r.merge))
            .skipDuplicates(r.equals)

    return {
        libraryImages: {
            signal: library
        },
        userImages: {
            signal: userImages,
            set: slot('userImages.set'),
            upload: slot('userImages.upload'),
            update: slot('userImages.update'),
            delete: slot('userImages.delete')
        },
        images: {
            getById: (it) =>
                kefir.combine(
                    [it],
                    [allImages]
                )
                .toProperty()
                .map(([id, allImages]) => allImages[id])
        }
    }
})
