let resourcesModel = require('model/resourcesModel.js')

module.exports = switchboard.component(
    ({ slot }) => {
        slot('fonts.loaded')
        .to(resourcesModel.loadedFonts.set)

        return {
            fonts: resourcesModel.fonts.signal
        }
    },
    ({ wiredState: { fonts }, wire }) =>
        <style ref={ r.pipe(r.always(r.keys(fonts)), wire('fonts.loaded')) }>
            { r.values(fonts).map((it) => `
                @font-face {
                    font-family: '${it.id}';
                    src: url(${it.body});
                }
            `) }
        </style>
)
