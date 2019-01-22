let gameModel = require('model/gameModel.js'),

    { templates } = require('constants/elements.js')


const TEXT_ALIGN = {
    left: { anchor: 'start', position: r.always(0) },
    center: { anchor: 'middle', position: (it) => it / 2 },
    right: { anchor: 'end', position: r.identity }
}

let renderers = {
        'image': (it) =>
            <image x={ it.x } y={ it.y } href={ it.body.body } width={ it.width } height={ it.height } />,
        'text': (it) =>
            <text
                x={ it.x + TEXT_ALIGN[it.textAlign || 'left'].position(it.width) }
                y={ it.y }
                style={{ fontSize: it.fontSize + 'pt', fill: it.color }}
                alignment-baseline='hanging'
                text-anchor={ TEXT_ALIGN[it.textAlign || 'left'].anchor }>
                { it.body }
            </text>
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
                    .flatMapLatest(([origin, { layer, onLayerInteract, type }]) =>
                        kefir.fromEvents(document.body, 'mousemove')
                        .takeUntilBy(endAction)
                        .map((e) => {
                            let isInverted = origin.directionX === 0,
                                diffX =
                                    !isInverted
                                        ? e.screenX - origin.x
                                        : origin.x - e.screenX,
                                newWidth = layer.width + diffX,
                                diffY =
                                    !isInverted
                                        ? e.screenY - origin.y
                                        : origin.y - e.screenY,
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
                    .flatMapLatest(([origin, { layer, onLayerInteract }]) =>
                        kefir.fromEvents(document.body, 'mousemove')
                        .takeUntilBy(endAction)
                        .map((e) => {
                            return ({
                                layer,
                                type: 'move',
                                body: {
                                    x: layer.x + e.screenX - origin.x,
                                    y: layer.y + e.screenY - origin.y
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
                    x={ layer.x } y={ layer.y }
                    className={ modifiersToClass('element-view__size-indicator', status) }
                    width={ layer.width }
                    height={ layer.height } />
                { points.map((it, idx) => it(layer.x, layer.y, layer.width, layer.height, wire('resize.start'))) }
            </g>
    ),
    renderElement = (it, onLayerInteract, selectedLayer) =>
        threadLast(it)(
            r.prop('body'),
            r.map((it) =>
                <g className={ modifiersToClass('element-view__svg-layer', selectedLayer === it.id && 'selected', it.isLocked && 'locked') }>
                    { React.cloneElement(
                        renderers[it.type](it),
                        onLayerInteract && {
                            onMouseDown:
                                r.pipe(cancel, r.always({ layer: it, type: 'mouseDown' }), onLayerInteract),
                            onMouseUp:
                                r.pipe(cancel, r.always({ layer: it, type: 'mouseUp' }), onLayerInteract),
                        }
                    ) }
                    <SizeIndicator
                        type={ it.type  }
                        selected={ selectedLayer === it.id }
                        onLayerInteract={ onLayerInteract }
                        layer={ it } />
                </g>
            )
        )

module.exports = switchboard.component(
    ({ slot, propsProperty }) => {
        kefir.combine(
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
        .onValue((onClick) => onClick())

        return {}
    },
    ({ wire, element, _ref, selectedLayer, viewBox, showDocument, onClick, onLayerInteract }) =>
        <svg className='element-view__element'
             viewBox={ viewBox || undefined }
             width='100%' height='100%'
             xmlns='http://www.w3.org/2000/svg'
             onMouseDown={ wire('click.start') }
             onClick={ wire('click.end') }
             ref={ _ref }>
            { showDocument && viewBox &&
                <rect
                    className='element-view__canvas'
                    width={ element.width }
                    height={ element.height }
                    x='0'
                    y='0' /> }
            { viewBox && renderElement(element, onLayerInteract, selectedLayer) }
        </svg>
)
