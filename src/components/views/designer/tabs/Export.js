let JSZip = require('jszip'),

    gameModel = require('model/gameModel.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    fileUtils = require('utils/fileUtils.js'),
    Button = require('components/common/Button.js')


let PrintedElement = switchboard.component(
    ({ slot, propsProperty, isAlive }) => {
        kefir.combine([
            slot('canvas.ref').filter(Boolean).skipDuplicates(),

            kefir.combine([
                slot('element.ref').filter(Boolean).skipDuplicates()
                .flatMapLatest((it) =>
                    kefir.fromPoll(100, () =>
                        r.all(
                            (it) => it.getAttribute('data-is-loaded') === 'true',
                            Array.from(it.querySelectorAll('image, text'))
                        )
                    )
                    .filter(Boolean)
                    .map(r.always(it))
                    .take(1)
                ),

                propsProperty.map(r.prop('element'))
                .map(r.pick(words('width height'))).skipDuplicates(r.equals)
            ])
            .flatMapLatest(([it, { width, height }]) => {
                let img = new Image()

                img.width = width
                img.height = height
                img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent((new XMLSerializer()).serializeToString(it))}`

                return kefir.fromEvents(img, 'load').map(r.always(img))
            }),

            propsProperty.map(r.pick(words('onRender element'))).skipDuplicates(r.equals)
        ])
        .takeUntilBy(isAlive.filter(r.not))
        .flatMapLatest(([canvas, svg, { onRender, element: { width, height } }]) => {
            let ctx = canvas.getContext('2d')

            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(svg, 0, 0)

            return kefir.fromCallback((fn) =>
                canvas.toBlob(fn)
            )
            .map(r.pair(onRender))
        })
        .onValue(([onRender, blob]) => onRender(blob))

        return {}
    },
    ({ element, wire, isBack }) =>
        <div>
            <canvas width={ element.width } height={ element.height } ref={ wire('canvas.ref') } style={{ width: element.width + 'px', height: element.height + 'px'}}>
            </canvas>

            <div>
                <ElementRenderer
                    sides={ !isBack ? 'front' : 'back' }
                    _ref={ wire('element.ref') }
                    showCutlines={ false }
                    showDocument
                    useExactSize
                    fetchMode='inline'
                    element={ element }
                    viewBox={ `${ isBack ? -element.width - 20 : 0 } 0 ${ element.width } ${ element.height }` } />
            </div>
        </div>
)

module.exports = switchboard.component(
    ({ slot, isAlive }) => {
        let includedElements = gameModel.elements.signal.map(r.filter((it) => it.count >= 0)),
            renderedElements =
                slot('element.rendered')
                .scan(
                    (memo, [{ isBack, name, id }, content]) =>
                        r.assoc(`${isBack ? 'back-' : 'face-'}${name}-${id}.png`, content, memo),
                    {}
                )
                .skipDuplicates(r.equals)

        kefir.combine(
            [slot('export')],
            [renderedElements, gameModel.name.signal]
        )
        .flatMapLatest(([_, it, name]) => {
            let zip = new JSZip()

            r.toPairs(it).forEach(([name, content]) =>
                zip.file(name, content)
            )

            return kefir.fromPromise(zip.generateAsync({ type: 'blob' })).map(r.pair(name)) })
        .onValue(([name, blob]) => fileUtils.saveBlob(`${name}.zip`, blob))

        return {
            loaded:
                kefir.combine([
                    includedElements.map(r.map(r.prop('id')))
                    .map((it) => it.concat(it.map((it) => it + '-back')))
                    .skipDuplicates(r.equals),

                    slot('element.rendered')
                    .map(r.head)
                    .scan((it, elem) =>
                        r.uniq(it.concat(elem.isBack ? elem.id + '-back' : elem.id)), []
                    )
                ])
                .toProperty()
                .takeUntilBy(isAlive.filter(r.not))
                .map(([a, b]) => r.equals(r.sortBy(r.identity, a), r.sortBy(r.identity, b)))
                .skipDuplicates(),
            elements: gameModel.elements.populateTemplate(includedElements)
        }
    },
    ({ wiredState: { elements, loaded }, wire }) =>
        <div className='view'>

            { loaded
              ? <VGroup modifiers='grow align-center'>
                    <Button onClick={ wire('export') } modifiers='fill blue'>Export images</Button>
                    <Type modifiers='align-center multiline'>
                        Downloaded ZIP file will include all components in this game. It will also include card backs for all components.
                    </Type>
                </VGroup>
              : <Type modifiers='align-center heading l'>Exporting images...</Type> }

            { elements.map((it) =>
                <div key={ it.id } style={{ display: 'none' }}>
                    <PrintedElement
                        element={ it }
                        onRender={ r.pipe(r.pair(it), wire('element.rendered')) } />

                    <PrintedElement
                        element={ it }
                        isBack
                        onRender={ r.pipe(r.pair({ ...it, isBack: true }), wire('element.rendered')) } />
                </div>
            ) }
        </div>
)
