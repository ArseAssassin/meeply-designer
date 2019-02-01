let uuid = require('uuid/v4'),

    TabBar = require('components/common/TabBar.js'),
    Modal = require('components/common/Modal.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    NewElement = require('components/views/designer/NewElement.js'),
    TestGame = require('components/views/designer/TestGame.js'),
    GameInfo = require('components/views/designer/GameInfo.js'),
    PrintView = require('components/views/print/PrintView.js'),
    Element = require('components/views/designer/Element.js'),
    Button = require('components/common/Button.js'),

    gameModel = require('model/gameModel.js'),
    resourcesModel = require('model/resourcesModel.js'),
    persistentSignal = require('model/persistentSignal.js'),

    fileUtils = require('utils/fileUtils.js')

require('./design-view.styl')

const FILE_REGEX = /^data:.+\/(.+);base64,(.*)$/

let tabTypes = {
        element: {
            component: Element,
            props: (props, wire, idx) => ({
                ...props,
                onFileChange: r.pipe(r.pair(idx), wire('tab.change'))
            }),
            label: ({ id }, elements) => (r.find(r.propEq('id', id), elements) || {}).name
        },
        newElement: {
            component: NewElement,
            props: (props, wire, idx) => ({
                onSubmit: (it) => {
                    wire('tabs.close')(idx + 1)
                    wire(gameModel.elements.createElement)(it)
                    wire('elements.open')(it.id)
                }
            }),
            label: () => '*Create new deck'
        },
        print: {
            component: PrintView,
            props: r.always({}),
            label: r.always('Print')
        },
        test: {
            component: TestGame,
            props: r.always({}),
            label: r.always('Test game')
        },
        info: {
            component: GameInfo,
            props: r.always({}),
            label: r.always('Game information')
        }
    },
    onDelete = (id, isImage) => r.pipe(
        r.always(id),
        switchboard.slot.toFn(isImage ? resourcesModel.userImages.delete : gameModel.elements.deleteElement)
    )

module.exports = switchboard.component(
    ({ signal, slot }) => {
        let pSignal = persistentSignal(signal),
            tabs = pSignal(
                'project-tabs',
                [],

                slot('elements.new'),
                (it) => it.concat({
                    component: 'newElement',
                    id: uuid()
                }),

                slot('print'),
                (it) => it.concat({
                    component: 'print',
                    id: uuid()
                }),

                slot('info'),
                (it) => it.concat({
                    component: 'info',
                    id: uuid()
                }),

                slot('test'),
                (it) => it.concat({
                    component: 'test',
                    id: uuid()
                }),

                slot('tab.change'),
                (it, [index, elementId]) =>
                    r.adjust(index, (it) => ({ ...it, props: { ...it.props, id: elementId }}), it),

                kefir.combine(
                    [slot('elements.open')],
                    [gameModel.elements.signal]
                ),
                (it, [elementId, elements]) =>
                    r.find(r.propEq('id', elementId), it.map(r.prop('props')))
                        ? it
                        : it.concat({
                            id: elementId,
                            component: 'element',
                            props: { id: elementId }
                        }),

                slot('tabs.close'),
                (it, idx) => r.remove(idx - 1, 1, it),

                gameModel.elements.signal.map(r.map(r.prop('id'))).skipDuplicates(r.equals),
                (it, ids) => it.filter((it) => it.component !== 'element' || r.contains(it.props.id, ids))
            )

        kefir.combine(
            [slot('save')],
            [gameModel.elements.signal, resourcesModel.userImages.signal]
        )
        .onValue(([_, elements, resources]) => fileUtils.save('project.json', {
            version: 1,
            elements,
            resources
        }))

        slot('new')
        .map(r.always([]))
        .to(gameModel.elements.set)

        slot('new')
        .map(r.always({}))
        .to(resourcesModel.userImages.set)

        slot('open')
        .flatMapLatest(() => fileUtils.load('.json'))
        .map(r.prop('body'))
        .filter((it) => FILE_REGEX.test(it))
        .map((it) => {
            let matches = it.match(FILE_REGEX),
                buffer = new Buffer(matches[2], 'base64')

            return JSON.parse(buffer.toString())
        })
        .thru((it) => {
            it.map(r.prop('resources')).to(resourcesModel.userImages.set)

            return it.map(r.prop('elements'))
        })
        .to(gameModel.elements.set)

        return ({
            selectedTab:
                kefir.combine([
                    pSignal(
                        'project-selectedTab',
                        0,

                        slot('tabs.select'),

                        kefir.combine(
                            [slot('elements.new')],
                            [tabs.map(r.prop('length'))]
                        )
                        .map(r.last),

                        kefir.combine(
                            [slot('elements.open')],
                            [tabs]
                        )
                        .map(([id, tabs]) => r.findIndex(r.propEq('id', id), tabs.map(r.prop('props'))) + 1)

                    ),
                    tabs.map(r.prop('length')).skipDuplicates()
                ])
                .toProperty()
                .map(([selection, max]) => Math.min(max, selection)),
            tabs,
            elements:
                gameModel.elements.populateTemplate(gameModel.elements.signal),
            decks:
                gameModel.elements.populateTemplate(gameModel.elements.signal.map(r.filter((it) => !it.template))),
            counts:
                gameModel.elements.counts,

            tabState: signal(
                {},

                slot('tabState.update'),
                r.merge
            ),
            userImages: resourcesModel.userImages.signal.map(r.pipe(r.values, r.sortBy(r.prop('name')))),
            isNewConfirmationOpen: signal(
                false,

                slot('new.toggle'), r.not
            )
        })
    },
    ({ wiredState: { userImages, tabState, decks, selectedTab, tabs, elements, counts, isNewConfirmationOpen }, wire }) =>
        <div className='design-view'>
            <Modal isOpen={ isNewConfirmationOpen } onClose={ wire('new.toggle') } heading='Create new project'>
                <VGroup>
                    <Type modifiers='align-center'>
                        Are you sure you want to create a new project? All unsaved changes will be lost.
                    </Type>

                    <HGroup modifiers='margin-s justify-end align-center'>
                        <button onClick={ wire('new.toggle') }>Cancel</button>
                        <button onClick={ r.pipe(r.tap(wire('new.toggle')), wire('new')) }>Create new project</button>
                    </HGroup>
                </VGroup>
            </Modal>

            <div className='design-view__toolbar'>
                <HGroup modifiers='grow align-center margin-none'>
                    <Button modifiers='s' onClick={ wire('new.toggle') }><Icon name='document' /></Button>
                    <Button modifiers='s' onClick={ wire('open') }><Icon name='folder' /></Button>
                    <Button modifiers='s' onClick={ wire('save') }><Icon name='save' /></Button>
                    <Button modifiers='s' onClick={ wire('print') }><Icon name='print' /></Button>
                    <Button modifiers='s' onClick={ wire('test') }><Icon name='test' /></Button>
                    <Button modifiers='s' onClick={ wire('info') }><Icon name='info' /></Button>
                </HGroup>
            </div>

            <TabBar selected={ selectedTab } onSelect={ wire('tabs.select') } onClose={ wire('tabs.close') }>
                <TabBar.Tab label='Game 1' closingDisabled>
                    <div className='game-view'>
                        <FileExplorer
                            rootName='/'
                            toolbarEnabled
                            canDelete={ (it) => it && !r.contains(it, words('create resources')) }>

                            { decks.map(({ name, id, ...deck }) =>
                                <FileExplorer.Folder
                                    value={ id }
                                    face={
                                        <ElementRenderer
                                            element={ deck }
                                            viewBox={ `0 0 ${ deck.width } ${ deck.height }`}
                                            showDocument />
                                    }
                                    label={ <HGroup modifiers='margin-s'>
                                        {name}
                                        <HGroup modifiers='margin-xs align-center'>
                                            <Icon name='count' modifiers='s' />
                                            { counts[id] }
                                        </HGroup>
                                    </HGroup> }
                                    onDelete={ onDelete(id) }
                                    deleteText='Deleting this component will delete the whole deck. Are you sure you want to continue?'
                                    name={ name }
                                    key={ id }>
                                    { elements.filter((it) => r.contains(id, [it.template, it.id])).map((it, idx) =>
                                        <FileExplorer.File
                                            name={ it.name }
                                            value={ it.id }
                                            onDelete={ onDelete(it.id) }
                                            deleteText={
                                                !it.template
                                                    ? 'Deleting this component will delete the whole deck. Are you sure you want to continue?'
                                                    : 'Are you sure you want to delete this component? This action can not be undone.'
                                            }
                                            onDoubleClick={ r.pipe(r.always(it.id), wire('elements.open')) }>
                                            <div className='design-view__file'>
                                                <ElementRenderer element={ it } viewBox={ `0 0 ${ it.width } ${ it.height }`} showDocument />
                                                <div className='design-view__count'>
                                                    <HGroup modifiers='margin-s align-center'>
                                                        <Icon name='count' modifiers='m' />
                                                        <input
                                                            onClick={ cancel }
                                                            onDoubleClick={ cancel }
                                                            step='1'
                                                            min='0'
                                                            type='number'
                                                            onChange={ r.pipe(
                                                                r.path(words('target value')),
                                                                parseInt,
                                                                r.pair(it.id),
                                                                wire(gameModel.elements.setCount)
                                                            ) }
                                                            value={ it.count } />
                                                    </HGroup>
                                                </div>
                                            </div>
                                        </FileExplorer.File>
                                    ) }
                                </FileExplorer.Folder>
                            ) }

                            { userImages.length
                                ? <FileExplorer.Folder
                                    name='Resources'
                                    value='resources'
                                    face={ <Icon name='image' /> }>
                                    { userImages.map((it) =>
                                        <FileExplorer.File
                                            value={ it.id }
                                            key={ it.id }
                                            onDelete={ onDelete(it.id, true) }
                                            deleteText='Are you sure you want to delete this resource? All images using it will be reset.'
                                            name={ it.name }>
                                            <img src={ it.body } alt='thumbnail' />
                                        </FileExplorer.File>
                                    ) }
                                </FileExplorer.Folder>
                                : null
                            }

                            <FileExplorer.File
                                value='create'
                                name='Create new deck'
                                onDoubleClick={ wire('elements.new') }>
                                <Icon name='create' />
                            </FileExplorer.File>
                        </FileExplorer>
                    </div>
                </TabBar.Tab>

                { tabs.map((it, idx) =>
                    <TabBar.Tab label={ tabTypes[it.component].label(it.props, elements) } key={ idx }>
                        { React.createElement(
                            tabTypes[it.component].component,
                            r.merge(
                                (tabTypes[it.component].props || r.identity)(it.props, wire, idx),
                                {
                                    tabState: tabState[it.id] || {},
                                    onTabState: r.pipe((update) => wire('tabState.update')({
                                        [it.id]: {
                                            ...tabState[it.id] || {},
                                            ...update
                                        }
                                    }))
                                }
                            )
                        ) }
                    </TabBar.Tab>
                ) }
            </TabBar>
        </div>
)
