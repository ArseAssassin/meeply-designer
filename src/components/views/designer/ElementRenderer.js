let WrappingText = require('components/common/WrappingText.js'),
    resourcesModel = require('model/resourcesModel.js'),
    { memoizedFunction } = require('utils/functionUtils.js')


const TEXT_ALIGN = {
    left: { anchor: 'start', position: (it) => -(it / 2) },
    center: { anchor: 'middle', position: r.always(0) },
    right: { anchor: 'end', position: (it) => it / 2 }
}

let getTransform = ({ rotation, mirror, x, y, width, height }) => [
        rotation && `rotate(${rotation} ${ x + width / 2 } ${ y + height / 2 })`,
        mirror && `translate(${ x * 2 + parseInt(width) } 0) scale(-1 1)`
    ].filter(Boolean).join(' '),

    Image = switchboard.component(
        ({ propsProperty }) => ({
            href:
                propsProperty
                .map(r.path(words('layer body')))
                .thru(resourcesModel.images.getById)
                .map(r.prop('body'))
                .skipDuplicates()
        }),
        ({ wiredState: { href }, layer }) =>
            <image
                href={ href }
                transform={ getTransform(layer) }
                {...r.pick(words('x y width height'), layer) } />,
    )

let renderers = {
        'image': (it) =>
            <Image layer={ it } />,
        'text': (it, loadedFonts) =>
            <WrappingText
                x={ it.x + TEXT_ALIGN[it.textAlign || 'left'].position(it.width) }
                y={ it.y }
                transform={ getTransform(it) }
                isInverted={ (it.rotation || 0) % 180 !== 0 }
                helperClass=''
                loadedFonts={ loadedFonts }
                width={ it.width }
                height={ it.height }
                isBold={ it.isBold }
                fontStyle={ it.fontStyle }
                fontFamily={ it.fontFamily }
                style={{ fontSize: it.fontSize + 'pt', fill: it.color }}
                alignmentBaseline='hanging'
                textAnchor={ TEXT_ALIGN[it.textAlign || 'left'].anchor }>
                { it.body }
            </WrappingText>,
        '': (it) => <text>?</text>
    },
    points = [
        [0, 0],
        // [1, 0],
        [1, 1],
        // [0, 1]
    ].map(([x, y]) => (xOrigin, yOrigin, width, height, onResize) =>
        <rect
            key={ [x, y] }
            className={ modifiersToClass('element-view__resize-indicator', x === y ? 'nwse' : 'nesw')}
            x={ xOrigin + width * x - 5 }
            y={ yOrigin + height * y - 5 }
            onMouseDown={ r.pipe(r.pair([x, y]), onResize) }
            width='10'
            height='10' />
    ),
    SizeIndicator = switchboard.component(
        ({ signal, slot, propsProperty }) => {
            let endAction = kefir.fromEvents(document.body, 'mouseup'),
                resizing =
                    kefir.combine(
                        [slot('resize.start').map(([direction, it]) => ({
                            directionX: direction[0],
                            directionY: direction[1],
                            x: it.screenX,
                            y: it.screenY
                        }))],
                        [propsProperty]
                    )
                    .flatMapLatest(([origin, { layer, onLayerInteract, type, zoomLevel }]) =>
                        kefir.fromEvents(document.body, 'mousemove')
                        .takeUntilBy(endAction)
                        .map((e) => {
                            let isInverted = origin.directionX === 0,
                                diffX =
                                    !isInverted
                                        ? (e.screenX - origin.x) / zoomLevel
                                        : (origin.x - e.screenX) / zoomLevel,
                                newWidth = layer.width + diffX,
                                diffY =
                                    !isInverted
                                        ? (e.screenY - origin.y) / zoomLevel
                                        : (origin.y - e.screenY) / zoomLevel,
                                newHeight = layer.height + diffY

                            return ({
                                layer,
                                type: 'resize',
                                body: {
                                    width: Math.max(20, newWidth),
                                    height: Math.max(20, newHeight),
                                    ...(isInverted
                                        ? { x: layer.x - diffX,
                                            y: layer.y - (newHeight - layer.height) }
                                        : {})
                                }
                            })
                        })
                        .map(r.pair(onLayerInteract))
                    ),
                moving =
                    kefir.combine(
                        [slot('move.start').map((it) => ({
                            x: it.screenX,
                            y: it.screenY
                        }))],
                        [propsProperty]
                    )
                    .filter(r.pipe(r.last, (it) => it.selected && !it.layer.isLocked))
                    .flatMapLatest(([origin, { layer, onLayerInteract, zoomLevel }]) =>
                        kefir.fromEvents(document.body, 'mousemove')
                        .takeUntilBy(endAction)
                        .map((e) => {
                            return ({
                                layer,
                                type: 'move',
                                body: {
                                    x: layer.x + (e.screenX - origin.x) / zoomLevel,
                                    y: layer.y + (e.screenY - origin.y) / zoomLevel
                                }
                            })
                        })
                        .map(r.pair(onLayerInteract))
                    )


            moving.onValue(([fn, value]) => fn(value))
            resizing.onValue(([fn, value]) => fn(value))

            return {
                status: signal(
                    '',

                    moving.map(r.always('moving')),
                    resizing.map(r.always('resizing')),
                    endAction.map(r.always(''))
                )
            }
        },
        ({ wiredState: { status }, layer, wire, onLayerInteract }) =>
            <g>
                <rect
                    onMouseDown={ wire('move.start') }
                    onClick={ onLayerInteract && r.pipe(cancel, r.always({ layer, type: 'click' }), onLayerInteract) }
                    onDoubleClick={ onLayerInteract && r.pipe(cancel, r.always({ layer, type: 'doubleclick' }), onLayerInteract) }
                    x={ layer.x } y={ layer.y }
                    className={ modifiersToClass('element-view__size-indicator', status) }
                    width={ layer.width }
                    height={ layer.height } />
                { points.map((it, idx) => it(layer.x, layer.y, layer.width, layer.height, wire('resize.start'))) }
            </g>
    ),
    renderElement = (it, onLayerInteract, selectedLayer, zoomLevel, interactive, loadedFonts) =>
        threadLast(it)(
            r.prop('body'),
            r.filter((it) => !it.hidden),
            r.map((it) =>
                <g className={ modifiersToClass('element-view__svg-layer', selectedLayer === it.id && 'selected', it.isCopy && 'copy') }>
                    { threadLast(renderers[it.type || ''](it, loadedFonts))(
                        (it) =>
                            interactive && onLayerInteract && !it.isLocked
                              ? React.cloneElement(
                                    it,
                                    {
                                        onMouseDown:
                                            r.pipe(cancel, r.always({ layer: it, type: 'mouseDown' }), onLayerInteract),
                                        onMouseUp:
                                            r.pipe(cancel, r.always({ layer: it, type: 'mouseUp' }), onLayerInteract)
                                    }
                                )
                              : it
                    ) }

                    { interactive && <SizeIndicator
                        type={ it.type }
                        zoomLevel={ zoomLevel }
                        selected={ selectedLayer === it.id }
                        onLayerInteract={ !it.isLocked && onLayerInteract }
                        layer={ it } /> }
                </g>
            )
        ),
    memoizedRenderElement = memoizedFunction(renderElement)

module.exports = switchboard.component(
    ({ slot, propsProperty }) => {
        propsProperty.map(r.prop('interactive'))
        .skipDuplicates()
        .flatMapLatest((it) =>
            it
              ? kefir.combine(
                    [slot('click.end')], [
                    kefir.merge([
                        slot('click.start').map(r.T),
                        slot('click.start').delay(200).map(r.F),
                    ]),
                    propsProperty.map(r.prop('onClick'))
                ])
                .map(r.tail)
                .filter(r.apply(r.and))
                .map(r.last)
              : kefir.never()
        )
        .onValue((onClick) => onClick())

        return {
            updateBy:
                propsProperty.map(r.prop('realTime')).skipDuplicates()
                .flatMapLatest((it) =>
                    it ? propsProperty.skipDuplicates(r.equals).throttle(1000 / 60)
                       : propsProperty.skipDuplicates(r.equals).debounce(700)
                ),
            loadedFonts:
                resourcesModel.loadedFonts.signal
        }
    },
    ({ wiredState: { loadedFonts }, wire, element, _ref, selectedLayer, viewBox, showDocument, onClick, onLayerInteract, onMouseDown, onMouseWheel, modifiers, zoomLevel, style, interactive, useExactSize=false, x, y }) =>
        <svg className={ modifiersToClass('element', modifiers) }
             viewBox={ viewBox || undefined }
             width={ useExactSize ? element.width : '100%'}
             height={ useExactSize ? element.height : '100%'}
             xmlns='http://www.w3.org/2000/svg'
             onMouseDown={ r.pipe(r.tap(wire('click.start')), onMouseDown || Boolean) }
             onWheel={ onMouseWheel }
             onClick={ wire('click.end') }
             style={ style }
             ref={ _ref }
             x={ x }
             y={ y }>
            { showDocument && viewBox &&
                <rect
                    className='element-view__canvas'
                    width={ element.width }
                    height={ element.height }
                    x='0'
                    y='0' /> }
            { viewBox && (
                interactive
                  ? renderElement(element, onLayerInteract, selectedLayer, zoomLevel, interactive, loadedFonts)
                  : memoizedRenderElement(element, onLayerInteract, selectedLayer, zoomLevel, interactive, loadedFonts)
            ) }
        </svg>
)
