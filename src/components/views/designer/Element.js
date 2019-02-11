let uuid = require('uuid/v4'),
    { required } = require('valivali'),

    Input = require('components/common/Input.js'),
    Modal = require('components/common/Modal.js'),
    FormField = require('components/forms/FormField.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    Button = require('components/common/Button.js'),
    FileBrowser = require('components/views/designer/FileBrowser.js'),
    gameModel = require('model/gameModel.js'),
    persistentSignal = require('model/persistentSignal.js'),
    Deck = require('components/views/designer/Deck.js'),

    componentForm = require('wireState/componentForm.js'),
    saveTabState = require('wireState/saveTabState.js'),

    { addToDeck }= require('utils/gameModelUtils.js')

require('./element.styl')

let getLayer = (layer, layers) =>
        r.find(r.propEq('id', layer), layers),

    adjustRotation = (rotation, delta) => ((rotation || 0) + delta + 360) % 360,
    getMirror = (layer, isVertical=false) =>
        r.always({
            mirror: !layer.mirror,
            rotation:
                (isVertical && (layer.rotation || 0) % 180 === 0) ||
                (!isVertical && (layer.rotation || 0) % 180 !== 0)
                    ? adjustRotation(layer.rotation, 180)
                    : layer.rotation
        }),

    FormRenderer = switchboard.component(
        ({ propsProperty, ...rest }) => {
            let { slot } = rest,
                { capture } = componentForm({
                    name: {
                        defaultValue: '',
                        validator: required()
                    }
                }, propsProperty.map(r.pipe(r.prop('layer'), r.pick(words('x y name width height body fontSize color')))).map((it) => ({ ...it, body: it.body || undefined }))
                )(rest),
                ref = slot('ref').filter(Boolean).toProperty().onValue(Boolean),
                imageFocus = slot('imageFocus.set').toProperty().onValue(Boolean)

            kefir.combine(
                [rest.slot('componentForm.update')],
                [propsProperty]
            )
            .onValue(([update, { onUpdate }]) => onUpdate(update))

            propsProperty.map(r.prop('onFocusForm'))
            .filter(Boolean)
            .take(1)
            .onValue((fn) => fn(switchboard.slot.toFn(slot('focus'))))

            slot('focus')
            .flatMap(() =>
                propsProperty.map(r.path(words('layer type')))
                .debounce(100)
                .flatMap((type) =>
                    type === 'text'
                    ? ref.debounce(100).take(1).map((it) => () =>
                        setTimeout(() => it.focus(), 100)
                    )
                    : imageFocus.debounce(100).filter(Boolean).take(1)
                )
                .take(1)
            )
            .onValue((fn) => fn())

            return { capture }
        },
        ({ wiredState: { capture }, wire, layer, isSlave }) =>
            <div className='element-view__layer-form'>
                <VGroup>
                    {layer.type === 'text' && capture(<FormField name='body'>
                        <Input.Textarea _ref={ wire('ref') } />
                    </FormField>)}

                    { layer.type === 'image' &&
                        capture(<FormField.Basic name='body'>
                            <FileBrowser
                                onImageFocus={ wire('imageFocus.set') }
                                id={ layer.id }
                                type='image' />
                        </FormField.Basic>)
                    }

                    { layer.type
                        ? capture(<FormField name='name'>
                            <Input.Text label='Layer name' disabled={ isSlave } />
                        </FormField>)
                        : <Type modifiers='s heading'>{ layer.name }</Type>
                    }

                    { layer.type &&
                        <HGroup modifers='align-center margin-s'>
                            <HGroup modifiers='margin-xs'>
                                x
                                { capture(<FormField name='x' reducer={ parseInt }>
                                    <Input.Number modifiers='number' />
                                </FormField>) }
                            </HGroup>

                            <HGroup modifiers='margin-xs'>
                                y
                                { capture(<FormField name='y' reducer={ parseInt }>
                                    <Input.Number modifiers='number' />
                                </FormField>) }
                            </HGroup>
                        </HGroup>
                    }

                    <HGroup modifiers='align-center'>
                        <HGroup modifiers='margin-xs'>
                            w
                            { capture(<FormField name='width' reducer={ parseInt }>
                                <Input.Number modifiers='number' />
                            </FormField>) }
                        </HGroup>

                        <HGroup modifiers='margin-xs'>
                            h
                            { capture(<FormField name='height' reducer={ parseInt }>
                                <Input.Number modifiers='number' />
                            </FormField>) }
                        </HGroup>
                    </HGroup>

                    { layer.type === 'text' &&
                        <VGroup>
                            <HGroup modifiers='align-center'>
                                <HGroup modifiers='margin-s align-center'>
                                    Aa
                                    {capture(<FormField name='fontSize' reducer={ parseInt }>
                                        <Input.Number modifiers='number' />
                                    </FormField>)}
                                </HGroup>

                                {capture(<FormField name='color'>
                                    <input type='color' />
                                </FormField>)}
                            </HGroup>

                            <HGroup modifiers='margin-s'>
                                { words('left center right').map((it) =>
                                    <button
                                        key={ it }
                                        onClick={ r.pipe(r.always({ textAlign: it }), wire('componentForm.update')) }
                                        className='element-view__tool'>
                                        <Icon name={ `align-${it}` } />
                                    </button>
                                )}
                            </HGroup>
                        </VGroup>
                    }

                    { layer.type && <HGroup modifiers='margin-s'>
                        <button
                            onClick={ r.pipe(
                                r.always({
                                    rotation: adjustRotation(layer.rotation, -90)
                                }),
                                wire('componentForm.update')
                            ) }
                            className='element-view__tool'>
                            <Icon name='rotate-ccw' />
                        </button>

                        <button
                            onClick={ r.pipe(
                                r.always({
                                    rotation: adjustRotation(layer.rotation, 90)
                                }),
                                wire('componentForm.update')
                            ) }
                            className='element-view__tool'><Icon name='rotate-cw' />
                        </button>

                        <button
                            onClick={ r.pipe(
                                getMirror(layer, false),
                                wire('componentForm.update')
                            ) }
                            className='element-view__tool'><Icon name='mirror-h' />
                        </button>

                        <button
                            onClick={ r.pipe(
                                getMirror(layer, true),
                                wire('componentForm.update')
                            ) }
                            className='element-view__tool'><Icon name='mirror-v' />
                        </button>
                    </HGroup> }
                </VGroup>
            </div>
    )

const
    LAYER_ICONS = {
        document: 'file',
        image: 'image',
        text: 'type'
    },
    DOCUMENT = 'document'

module.exports = switchboard.component(
    saveTabState(({ propsProperty, savedSignal, signal, slot }) => {
        let elementId = propsProperty.map(r.prop('id')).skipDuplicates(),
            element = gameModel.elements.findById(elementId),
            layers =
                kefir.combine([element], [element])
                .map(([it, element]) =>
                    [{ type: DOCUMENT, name: element.name, id: DOCUMENT }].concat(it.body)
                )
                .toProperty(),
            selectedLayer =
                savedSignal('selectedLayer')(
                    DOCUMENT,

                    slot('layer.select'),

                    slot('layer.interact').filter(r.propEq('type', 'click')).map(r.path(words('layer id'))),

                    layers.map(r.map(r.prop('id'))),
                    (it, layers) =>
                        r.contains(it, layers)
                            ? it
                            : DOCUMENT,

                    layers.map(r.map(r.prop('id')))
                    .skipDuplicates(r.equals)
                    .slidingWindow(2, 2)
                    .map(r.pipe(r.reverse, r.apply(r.difference), r.head))
                    .filter(Boolean)
                )
                .skipDuplicates(),
            deck =
                element
                .flatMapLatest(({ id, template }) =>
                    gameModel.elements.signal
                    .map((elements) => threadLast(elements)(
                        r.filter((it) =>
                            template
                                ? it.template === template || it.id === template
                                : it.template === id || it.id === id
                        ),
                        r.map((it) => ({ ...it, template: it.template || '' })),
                        r.sortWith([r.ascend(r.prop('template')), r.ascend((it) => r.findIndex(r.propEq('id', it.id), elements))])
                    ))
                )
                .flatMapLatest((deck) =>
                    deck.length
                        ? kefir.combine(deck.map((it) => gameModel.elements.findById(kefir.constant(it.id))))
                        : kefir.constant([])
                )
                .toProperty()
                .skipDuplicates(r.equals),

            deckShown =
                persistentSignal(signal)(
                    'project-deckShown',
                    true,

                    slot('deck.toggle'), r.not
                ),

            zoomLevel =
                savedSignal('zoomLevel')(
                    1,

                    kefir.merge([
                        kefir.combine([
                            slot('zoom')
                            .throttle(1000 / 5)
                        ], [signal(
                            false,

                            kefir.fromEvents(document.body, 'keydown').filter((it) => it.keyCode === 18), r.T,
                            kefir.fromEvents(document.body, 'keyup').filter((it) => it.keyCode === 18), r.F
                        )])
                        .filter(r.last)
                        .map(r.head),

                        slot('zoom.click')
                    ])
                    .map((it) => Math.sign(it) * -1),
                    (it, deltaY) => Math.max(0.25, it + deltaY * 0.25)
                ),

            offset = savedSignal('offset')(
                [0, 0],

                slot('grab.start')
                .map(r.pick(words('screenX screenY')))
                .flatMapLatest((origin) =>
                    kefir.combine([offset, zoomLevel]).take(1)
                    .flatMapLatest(([[x, y], zoomLevel]) =>
                        kefir.fromEvents(document.body, 'mousemove')
                        .map((it) => [
                            x + (origin.screenX - it.screenX) / zoomLevel,
                            y + (origin.screenY - it.screenY) / zoomLevel
                        ])
                        .takeUntilBy(kefir.fromEvents(document.body, 'mouseup'))
                    )
                )
            ),

            focusForm = signal(
                Boolean,

                slot('focusForm.set')
            ),

            isDragging = signal(
                false,

                kefir.merge([
                    slot('drag.start'),
                    kefir.fromEvents(document.body, 'mouseup').map(r.F)
                ])
                .flatMapLatest((it) =>
                    !it ? kefir.constant(false) : kefir.later(200, it)
                )
            )
            .skipDuplicates(),

            dragTarget = signal(
                undefined,

                slot('drag.target.set'),
                isDragging.filter(r.not), r.always(undefined)
            )

        isDragging
        .filter(Boolean)
        .flatMapLatest((initial) =>
            kefir.combine(
                [isDragging.filter(r.not)],
                [dragTarget.filter(Boolean), elementId]
            )
            .take(1)
            .map(([_, target, elementId]) => [elementId, initial, target])
        )
        .filter(([_, a, b]) => a !== b)
        .to(gameModel.elements.adjustLayer)

        kefir.combine(
            [slot('layer.interact').filter(r.propEq('type', 'doubleclick'))],
            [focusForm]
        )
        .map(r.last)
        .onValue((it) => it())

        kefir.combine([
            kefir.merge([
                slot('layer.interact')
                .filter(r.pipe(r.prop('type'), r.contains(r.__, words('resize move')))),

                slot('layers.hidden.set')
                .map(([id, status]) => ({ layer: { id }, body: { hidden: status }}))
            ])
        ], [elementId, zoomLevel])
        .map(([{ layer: { id }, body }, elementId]) => [id, elementId, {
            ...body
        }])
        .to(gameModel.elements.updateLayer)

        kefir.combine([
            slot('layers.image.add')
            .map((event) => ({
                type: 'image',
                name: 'Image',
                hidden: false,
                width: 180,
                height: 100,
                body: undefined,
                x: 0,
                y: 0,
                rotation: 0,
                mirror: false,
                id: uuid()
            }))
        ], [elementId])
        .to(gameModel.elements.addLayer)

        kefir.combine([
            slot('layers.text.add')
            .map(() => ({
                body: 'Type your text here',
                width: 180,
                height: 100,
                type: 'text',
                name: 'Text',
                hidden: false,
                textAlign: 'center',
                fontSize: 12,
                x: 0,
                y: 0,
                rotation: 0,
                mirror: false,
                id: uuid()
            }))
        ], [elementId])
        .to(gameModel.elements.addLayer)

        addToDeck(kefir.combine(
            [slot('deck.add')],
            [element.map((it) => it.template || it.id)]
        ).map(r.last))
        .flatMapLatest((it) =>
            propsProperty.map(r.prop('onFileChange')).take(1).map(r.pair(it.id))
        )
        .onValue(([id, onFileChange]) => onFileChange(id))

        kefir.combine(
            [slot('layers.delete')],
            [elementId, selectedLayer]
        )
        .filter(([_, _0, selectedLayer]) => selectedLayer !== DOCUMENT)
        .map(([_, elementId, selectedLayer]) => [selectedLayer, elementId])
        .to(gameModel.elements.deleteLayer)

        kefir.combine(
            [slot('file.change').filter((it) => it !== 'create')],
            [propsProperty]
        )
        .onValue(([it, { onFileChange }]) =>
            onFileChange(it)
        )

        kefir.combine(
            [slot('form.update')],
            [elementId, selectedLayer]
        )
        .filter(([_, _0, type]) => type === DOCUMENT)
        .map(r.pipe(r.take(2), r.reverse))
        .to(gameModel.elements.updateElement)

        kefir.combine(
            [slot('form.update')],
            [elementId, selectedLayer]
        )
        .filter(([_, _0, type]) => type !== DOCUMENT)
        .map(r.reverse)
        .to(gameModel.elements.updateLayer)

        kefir.combine(
            [slot('lock.set')],
            [elementId]
        )
        .map(([[layerId, body], elementId]) => [layerId, elementId, body])
        .to(gameModel.elements.updateLayer)

        kefir.combine(
            [slot('element.delete')],
            [deck, propsProperty]
        )
        .onValue(([id, deck, { onFileChange }]) => {
            let index = r.findIndex(r.propEq('id', id), deck),
                nextIndex =
                    index === deck.length - 1
                        ? index - 1
                        : index + 1

            onFileChange(deck[nextIndex].id)
        })
        .map(r.head)
        .to(gameModel.elements.deleteElement)

        return ({
            element,
            zoomLevel,
            canvasSize:
                signal(
                    [0, 0, 0, 0,],

                    slot('ref')
                    .filter(Boolean)
                    .skipDuplicates()
                    .flatMapLatest((it) =>
                        kefir.combine([
                            kefir.defaultValue(
                                undefined,
                                kefir.merge([
                                    kefir.fromEvents(window, 'resize'),
                                    deckShown.delay(1000 / 60)
                                ])
                            )
                            .map(() => {
                                let [width, height] =
                                        words('width height')
                                        .map((pos) => it.getBoundingClientRect()[pos])

                                return [width, height]
                            })
                            .skipDuplicates(r.equals),

                            element,

                            zoomLevel
                        ])
                        .map(([[width, height], element, zoomLevel]) => {
                            let x = element.width / 2 - (width / zoomLevel) / 2,
                                y = element.height / 2 - (height / zoomLevel) / 2

                            return [x, y, width, height]
                        })
                    )
                ),
            offset,
            layers,
            selectedLayer,
            deckShown,
            deck,
            isDragging,
            focusForm,
            templateWarningOpen: signal(
                false,

                slot('templateWarning.toggle'), r.not
            ),
            documentMode: selectedLayer.map(r.equals(DOCUMENT)),
            grabbing: signal(
                false,

                slot('grab.start')
                .flatMapLatest(() =>
                    kefir.defaultValue(true, kefir.fromEvents(document.body, 'mouseup').map(r.F).take(1))
                )
            ),
            dragTarget
        })
    }),
    ({ wiredState: { isDragging, focusForm, zoomLevel, grabbing, deck, deckShown, templateWarningOpen, documentMode, selectedLayer, offset, layers, selectedTool, element, canvasSize, targetLayer, dragTarget }, wire, onFileChange }) =>
        <div className='element-view'>
            <Deck element={ element } deck={ deck } deckShown={ deckShown } onDeckToggle={ wire('deck.toggle') } onFileChange={ wire('file.change') } onDeckAdd={ wire('deck.add') } />
            <div className='element-view__designer' ref={ wire('ref') }>
                <div className='element-view__zoom-level'>
                    <HGroup modifiers='margin-s align-center'>
                        <Button modifiers='s' onClick={ r.pipe(r.always(1), wire('zoom.click')) }>-</Button>
                        <HGroup modifiers='margin-xs align-center'>
                            <Icon name='zoom' modifiers='s' />
                            <Type modifiers='s'>{ zoomLevel * 100 }%</Type>
                        </HGroup>
                        <Button modifiers='s' onClick={ r.pipe(r.always(-1), wire('zoom.click')) }>+</Button>
                    </HGroup>
                </div>
                <ElementRenderer
                    modifiers={ [documentMode && 'document-mode', grabbing && 'grabbing'] }
                    realTime
                    debounceUpdates={ 0 }
                    element={ element }
                    zoomLevel={ zoomLevel }
                    viewBox={
                        r.zip(
                            canvasSize,

                            offset.map((it) => (a) => a + it)
                            .concat(r.repeat((a) => a / zoomLevel, 2))
                        )
                        .map(([it, fn]) => fn(it))
                        .join(' ')
                    }
                    onLayerInteract={ wire('layer.interact') }
                    onClick={ r.pipe(r.always(DOCUMENT), wire('layer.select')) }
                    onMouseDown={ documentMode && wire('grab.start') }
                    onMouseWheel={ r.pipe(r.prop('deltaY'), wire('zoom')) }
                    selectedLayer={ selectedLayer }
                    showDocument />
            </div>

            <div className='element-view__toolbar'>
                <VGroup modifiers='grow'>
                    <div className='element-view__toolbar-panel' data-group-modifiers='grow'>
                        { ((layer) =>
                            <FormRenderer
                                isSlave={ element.template }
                                onUpdate={ wire('form.update') }
                                onFocusForm={ wire('focusForm.set') }
                                layer={ layer.type === 'document' ? element : layer } />
                        )(r.find(r.propEq('id', selectedLayer), layers)) }
                    </div>
                    <div className='element-view__toolbar-panel' data-group-modifiers='grow'>
                        <Modal isOpen={ templateWarningOpen } heading='Modify template' onClose={ wire('templateWarning.toggle') }>
                            <VGroup modifiers='margin-s'>
                                <Type modifiers='multiline'>New layers can be added only to the deck template. To create a layer that is shown only for this card, you can hide it from other components using the <Icon name='visible' modifiers='inline s' /> button.</Type>

                                <HGroup modifiers='grow justify-end margin-s'>
                                    <button onClick={ wire('templateWarning.toggle') }>
                                        Cancel
                                    </button>

                                    <button onClick={ (it) => {
                                        wire('templateWarning.toggle')()
                                        onFileChange(element.template)
                                    } }>Take me to the template</button>
                                </HGroup>
                            </VGroup>
                        </Modal>

                        <VGroup data-group-modifiers='grow' modifiers='grow'>
                            <HGroup modifiers='justify-space-between align-center'>
                                <HGroup modifiers='margin-xs'>
                                    <button
                                        className='element-view__add-layer'
                                        onClick={ wire(element.template ? 'templateWarning.toggle' : 'layers.image.add') }>
                                        <HGroup modifiers='margin-xs'>
                                            <Icon name='image' />
                                            <Icon name='plus' />
                                        </HGroup>
                                    </button>

                                    <button
                                        className='element-view__add-layer'
                                        onClick={ wire(element.template ? 'templateWarning.toggle' : 'layers.text.add') }>
                                        <HGroup modifiers='margin-xs'>
                                            <Icon name='type' />
                                            <Icon name='plus' />
                                        </HGroup>
                                    </button>
                                </HGroup>

                                <button
                                    disabled={
                                        element.template
                                            ? selectedLayer === DOCUMENT || getLayer(selectedLayer, layers).isLinked
                                            : selectedLayer === DOCUMENT
                                    }
                                    className='element-view__tool'
                                    onClick={ wire('layers.delete') }>
                                    <Icon name={ element.template && selectedLayer !== DOCUMENT ? 'reset' : 'trash'} />
                                </button>
                            </HGroup>

                            <VGroup modifiers='grow margin-none' data-group-modifiers='grow'>
                                { r.reverse(layers).map((it) =>
                                    <div onMouseOver={ isDragging ? r.pipe(r.always(it.id), wire('drag.target.set')) : Boolean }
                                        className={
                                            modifiersToClass(
                                                'element-view__layer',
                                                selectedLayer === it.id && 'selected',
                                                element.template && it.isLocked && 'locked',
                                                dragTarget === it.id && 'targeted'
                                            ) }>
                                        <HGroup modifiers='margin-xs grow align-center'>
                                            <Button
                                                style={{ visibility: it.type === DOCUMENT && 'hidden' }}
                                                modifiers='xs'
                                                onClick={ r.pipe(r.always([it.id, !it.hidden]), wire('layers.hidden.set')) }>
                                                <Icon name={ it.hidden ? 'hidden' : 'visible'} modifiers='xs' />
                                            </Button>

                                            <button
                                                onDoubleClick={ focusForm }
                                                onMouseDown={ r.pipe(r.always(it.id), r.tap(wire('layer.select')), !it.id !== DOCUMENT ? wire('drag.start') : Boolean) }
                                                data-group-modifiers='grow'
                                                >
                                                    <HGroup modifiers='margin-s align-center' data-group-modifiers='grow'>
                                                        <Icon name={ LAYER_ICONS[it.type] } />
                                                        { it.name }
                                                    </HGroup>
                                            </button>

                                            { element.template && !it.isLocked
                                                ? <Icon name={ it.isLinked && 'link' } modifiers='s' />
                                                : <Button
                                                    modifiers='xs'
                                                    disabled={ it.isLocked && element.template }
                                                    onClick={ r.pipe(
                                                        r.always([it.id, { isLocked: !it.isLocked }]),
                                                        wire('lock.set')
                                                    ) }>
                                                    <Icon
                                                        name={ it.isLocked ? 'lock' : 'unlock' }
                                                        modifiers='xs' />
                                                </Button> }
                                        </HGroup>
                                    </div>
                                )}
                            </VGroup>
                        </VGroup>
                    </div>
                </VGroup>
            </div>
        </div>
)
