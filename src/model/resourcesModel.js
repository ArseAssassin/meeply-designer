let crypto = require('crypto')

let fractalFiles = ((ctx) => {
        let keys = ctx.keys()
        let values = keys.map(ctx)

        return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {})
    })(require.context('../../assets/Fractal Symbols/', true, /.svg$/))

let persistentSignal = require('model/persistentSignal.js')


module.exports = switchboard.model(({ signal, slot }) => {
    let fractal =
            threadLast(fractalFiles)(
                r.toPairs,
                r.map(([key, value]) => ([key, {
                    name: r.last(key.split('/')),
                    id: key,
                    body: value,
                    license:
                        <Type modifiers='xs'><a rel='noopener noreferrer' href='http://afractalthought.com/fractal-symbols/board-game-library/' target='_blank'>Fractal Symbols</a> by Felix Thålin. Licensed under <a rel='noopener noreferrer' href='https://creativecommons.org/licenses/by/4.0/' target='_blank'>Creative Commons Attrubution 4.0 International</a> license.</Type>
                }])),
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

                slot('userImages.set')
            )

    return {
        libraryImages: {
            signal: fractal
        },
        userImages: {
            signal: userImages,
            set: slot('userImages.set'),
            upload: slot('userImages.upload')
        },
        images: {
            getById: (it) =>
                kefir.combine(
                    [it],
                    [userImages, fractal]
                )
                .toProperty()
                .map(([id, userImages, fractalFiles]) => ({ ...userImages, ...fractalFiles })[id])
        }
    }
})
