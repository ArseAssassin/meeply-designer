let uuid = require('uuid/v4'),
    { required } = require('valivali'),

    Input = require('components/common/Input.js'),
    FormField = require('components/forms/FormField.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    FileBrowser = require('components/views/designer/FileBrowser.js'),
    gameModel = require('model/gameModel.js'),
    persistentSignal = require('model/persistentSignal.js'),

    { DEFAULT_PPI } = require('constants/units.js'),
    componentForm = require('wireState/componentForm.js')

require('./element.styl')

let findName = (name, names, index=2) => {
        let proposedName = `${name} #${index}`

        return r.contains(proposedName, names)
            ? findName(name, name, index + 1)
            : proposedName
    },
    getLayer = (layer, layers) =>
        r.find(r.propEq('id', layer), layers),

    FormRenderer = switchboard.component(
        ({ propsProperty, ...rest }) => {
            let { capture, formValue } = componentForm({
                name: {
                    defaultValue: '',
                    validator: required()
                }
            }, propsProperty.map(r.pipe(r.prop('layer'), r.pick(words('x y name width height body fontSize color')))))(rest)

            kefir.combine(
                [rest.slot('componentForm.update')],
                [propsProperty]
            )
            .onValue(([update, { onUpdate }]) => onUpdate(update))

            return { capture }
        },
        ({ wiredState: { capture }, wire, layer }) =>
            <div className='element-view__layer-form'>
                <VGroup>
                    <Type modifiers='heading'>Edit layer</Type>

                    { capture(<FormField name='name'>
                        <Input.Text label='Name' />
                    </FormField>) }

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

                    <HGroup modifiers='align-center margin-s'>
                        { capture(<FormField name='width'>
                            <Input.Number modifiers='number' />
                        </FormField>) }
                        x
                        { capture(<FormField name='height'>
                            <Input.Number modifiers='number' />
                        </FormField>) }
                        px
                    </HGroup>

                    { layer.type === 'text' &&
                        <VGroup>
                            <HGroup modifiers='align-center'>
                                <HGroup modifiers='margin-s align-center'>
                                    Aa
                                    {capture(<FormField name='fontSize'>
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

                            {capture(<FormField name='body'>
                                <Input.Textarea />
                            </FormField>)}
                        </VGroup>
                    }

                    { layer.type === 'image' &&
                        capture(<FormField.Basic name='body'>
                            <FileBrowser type='image' />
                        </FormField.Basic>)
                    }
                </VGroup>
            </div>
    )

const
    TOOLS = [
        { name: 'cursor', icon: 'cursor' },
        { name: 'image', icon: 'image' },
        { name: 'text', icon: 'type' }
    ],
    LAYER_ICONS = {
        document: 'file',
        image: 'image',
        text: 'type'
    },
    DOCUMENT = 'document'

module.exports = switchboard.component(
    ({ propsProperty, signal, slot }) => {
        let elementId = propsProperty.map(r.prop('id')).skipDuplicates(),
            element = gameModel.elements.findById(elementId),
            isLocked = element.map(r.prop('isLocked')),
            layers =
                kefir.combine([element], [element])
                .map(([it, element]) =>
                    it.body.concat([{ type: DOCUMENT, name: element.name, id: DOCUMENT }])
                )
                .toProperty(),
            selectedLayer =
                signal(
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
                    .map(r.pipe(r.apply(r.difference), r.head))
                    .filter(Boolean)
                    .onValue(Boolean),

                    layers.map(r.map(r.prop('id')))
                    .skipDuplicates(r.equals)
                    .slidingWindow(2, 2)
                    .map(r.pipe(r.reverse, r.apply(r.difference), r.head))
                    .filter(Boolean)
                ),
            deck =
                element

                .flatMapLatest(({ id, template }) =>
                    gameModel.elements.signal
                    .map(r.filter((it) =>
                        template
                            ? it.template === template || it.id === template
                            : it.template === id || it.id === id
                    ))
                    .map(r.sortBy(r.prop('template')))
                )
                .flatMapLatest((deck) =>
                    deck.length
                        ? kefir.combine(deck.map((it) => gameModel.elements.findById(kefir.constant(it.id))))
                        : kefir.constant([])
                )
                .toProperty(),

            deckShown =
                persistentSignal(signal)(
                    'project-deckShown',
                    true,

                    slot('deck.toggle'), r.not
                )

        kefir.combine([
            slot('layer.interact')
            .filter(r.pipe(r.prop('type'), r.contains(r.__, words('resize move'))))
        ], [elementId])
        .map(([{ layer: { id }, body }, elementId]) => [id, elementId, {
            ...body
        }])
        .to(gameModel.elements.updateLayer)

        kefir.combine([
            slot('layers.image.add')
            .map((event) => ({
                type: 'image',
                name: 'Image',
                width: 150,
                height: 100,
                body: { name: '' },
                x: 0,
                y: 0,
                id: uuid()
            }))
        ], [elementId])
        .to(gameModel.elements.addLayer)

        kefir.combine([
            slot('layers.text.add')
            .map(() => ({
                body: 'Text',
                width: 150,
                height: 100,
                type: 'text',
                name: 'Text',
                x: 0,
                y: 0,
                id: uuid()
            }))
        ], [elementId])
        .to(gameModel.elements.addLayer)

        kefir.combine([slot('deck.add')], [elementId, element, gameModel.elements.signal])
        .map(([_, elementId, element, elements]) => ({
            template: element.template || elementId,
            name: findName(
                element.template
                    ? r.find(r.propEq('id', element.template), elements).name
                    : element.name,
                elements.map(r.prop('name'))
            ),
            id: uuid(),
            count: 1,
            body: []
        }))
        .to(gameModel.elements.createElement)
        .flatMapLatest((it) =>
            propsProperty.map(r.prop('onFileChange')).take(1).map(r.pair(it.id))
        )
        .onValue(([id, onFileChange]) => onFileChange(id))

        kefir.combine(
            [slot('layers.delete')],
            [elementId, selectedLayer]
        )
        .filter(([_, _0, selectedLayer]) => selectedLayer !== 'document')
        .map(([_, elementId, selectedLayer]) => [selectedLayer, elementId])
        .to(gameModel.elements.deleteLayer)

        kefir.combine(
            [slot('layers.delete')],
            [propsProperty, elementId, deck, selectedLayer]
        )
        .filter(r.pipe(r.last, r.equals('document')))
        .onValue(([_, { onFileChange }, elementId, deck]) =>
            onFileChange(deck[r.findIndex(r.propEq('id', elementId), deck) - 1].id)
        )

        kefir.combine(
            [slot('layers.delete')],
            [elementId, selectedLayer]
        )
        .filter(([_, _0, selectedLayer]) => selectedLayer === 'document')
        .map(([_, elementId]) => elementId)
        .to(gameModel.elements.deleteElement)

        kefir.combine(
            [slot('file.change')],
            [deck, propsProperty]
        )
        .onValue(([index, deck, { onFileChange }]) =>
            deck[index] && onFileChange(deck[index].id)
        )

        kefir.combine(
            [slot('form.update')],
            [elementId, selectedLayer]
        )
        .filter(([_, _0, type]) => type === 'document')
        .map(r.pipe(r.take(2), r.reverse))
        .to(gameModel.elements.updateElement)

        kefir.combine(
            [slot('form.update')],
            [elementId, selectedLayer]
        )
        .filter(([_, _0, type]) => type !== 'document')
        .map(r.reverse)
        .to(gameModel.elements.updateLayer)

        return ({
            element,
            canvasSize:
                signal(
                    '',

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

                            element
                        ])
                        .map(([[width, height], element]) => {
                            let x = element.width / 2 - width / 2,
                                y = element.height / 2 - height / 2.5

                            return [x, y, width, height].join(' ')
                        })
                    )
                ),
            layers,
            selectedLayer,
            deckShown,
            deck
        })
    },
    ({ wiredState: { deckShown, deck, selectedLayer, layers, selectedTool, element, canvasSize }, wire }) =>
        <div className='element-view'>
            <div className={ modifiersToClass('element-view__deck', deckShown && 'shown') }>
                <button className='element-view__tab' onClick={ wire('deck.toggle') }>Deck</button>

                <FileExplorer
                    mustSelect
                    hideBreadcrumbs
                    onChange={ wire('file.change') }
                    defaultValue={ r.findIndex(r.propEq('id', element.id), deck) }>
                    { deck.map((it) =>
                        <FileExplorer.File name={ it.name }>
                            <ElementRenderer element={ it } viewBox={ `0 0 ${ it.width } ${ it.height }`} showDocument />
                        </FileExplorer.File>
                    ) }

                    <FileExplorer.File
                        name='Create element'
                        onDoubleClick={ wire('deck.add') }>
                        <Icon name='create' />
                    </FileExplorer.File>
                </FileExplorer>
            </div>

            <ElementRenderer
                element={ element }
                viewBox={ canvasSize }
                onLayerInteract={ wire('layer.interact') }
                onClick={ r.pipe(r.always(DOCUMENT), wire('layer.select')) }
                onMouseDown={ wire('document.mouseDown') }
                onMouseUp={ wire('document.mouseUp') }
                onMouseMove={ wire('document.move') }
                selectedLayer={ selectedLayer }
                showDocument
                _ref={ wire('ref') } />

            <div className='element-view__toolbar'>
                <VGroup modifiers='grow'>
                    <div className='element-view__toolbar-panel'>
                        { ((layer) =>
                            <FormRenderer onUpdate={ wire('form.update') } layer={ layer.type === 'document' ? element : layer } />
                        )(r.find(r.propEq('id', selectedLayer), layers)) }
                    </div>
                    <div className='element-view__toolbar-panel' data-group-modifiers='grow'>
                        <VGroup data-group-modifiers='grow'>
                            <HGroup modifiers='justify-space-between align-center'>
                                <HGroup modifiers='margin-xs'>
                                    <button
                                        disabled={ element.template }
                                        className='element-view__add-layer'
                                        onClick={ wire('layers.image.add') }>
                                        <HGroup modifiers='margin-xs'>
                                            <Icon name='image' modifiers='l' />
                                            <Icon name='plus' modifiers='l' />
                                        </HGroup>
                                    </button>

                                    <button
                                        disabled={ element.template }
                                        className='element-view__add-layer'
                                        onClick={ wire('layers.text.add') }>
                                        <HGroup modifiers='margin-xs'>
                                            <Icon name='type' modifiers='l' />
                                            <Icon name='plus' modifiers='l' />
                                        </HGroup>
                                    </button>
                                </HGroup>

                                <button
                                    disabled={
                                        element.template
                                            ? !(selectedLayer === DOCUMENT || !getLayer(selectedLayer, layers).isLinked)
                                            : selectedLayer !== DOCUMENT
                                    }
                                    className='element-view__tool'
                                    onClick={ wire('layers.delete') }>
                                    <Icon name={ element.template && selectedLayer !== DOCUMENT ? 'reset' : 'trash'} modifiers='l' />
                                </button>
                            </HGroup>

                            <VGroup modifiers='grow margin-none'>
                                { layers.map((it) =>
                                    <button
                                        onClick={ r.pipe(r.always(it.id), wire('layer.select')) }
                                        className={
                                            modifiersToClass(
                                                'element-view__layer',
                                                selectedLayer === it.id && 'selected',
                                                it.isLocked && 'locked'
                                            ) }>
                                        <HGroup modifiers='margin-s align-center justify-space-between'>
                                            <HGroup modifiers='margin-s align-center'>
                                                <Icon name={ LAYER_ICONS[it.type] } modifiers='l' />
                                                { it.name }
                                            </HGroup>

                                            <Icon name={ it.isLocked && it.isLinked && 'link' } modifiers='s' />
                                        </HGroup>
                                    </button>
                                )}
                            </VGroup>
                        </VGroup>
                    </div>
                </VGroup>
            </div>
        </div>
)
