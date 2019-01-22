let TabBar = require('components/common/TabBar.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    NewElement = require('components/views/designer/NewElement.js'),
    Element = require('components/views/designer/Element.js'),
    gameModel = require('model/gameModel.js'),

    persistentSignal = require('model/persistentSignal.js')

require('./design-view.styl')

let tabTypes = {
        element: {
            component: Element,
            props: (props, wire, idx) => ({
                ...props,
                onFileChange: r.pipe(r.pair(idx), wire('tab.change'))
            }),
            label: ({ id }, elements) => r.find(r.propEq('id', id), elements).name
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
        }
    },
    NewElementTab = (onClose) => () =>
        <NewElement onSubmit={ onClose } />

module.exports = switchboard.component(
    ({ signal, slot }) => {
        let pSignal = persistentSignal(signal),
            tabs = pSignal(
                'project-tabs',
                [],

                slot('elements.new'),
                (it) => it.concat({
                    component: 'newElement'
                }),

                slot('tab.change'),
                (it, [index, elementId]) =>
                    r.adjust(index, (it) => ({ ...it, props: { ...it.props, id: elementId }}), it),

                kefir.combine(
                    [slot('elements.open')],
                    [gameModel.elements.signal]
                ),
                (it, [elementId, elements]) =>
                    r.find(r.propEq('id', elementId), it)
                        ? it
                        : it.concat({
                            id: elementId,
                            component: 'element',
                            props: { id: elementId }
                        }),

                slot('tabs.close'),
                (it, idx) => r.remove(idx - 1, 1, it)
            )

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
                        .map(([id, tabs]) => r.findIndex(r.propEq('id', id), tabs) + 1)

                    ),
                    tabs.map(r.prop('length')).skipDuplicates()
                ])
                .toProperty()
                .map(([selection, max]) => Math.min(max, selection)),
            tabs,
            elements:
                gameModel.elements.populateTemplate(gameModel.elements.signal)
        })
    },
    ({ wiredState: { selectedTab, tabs, elements }, wire }) =>
        <TabBar selected={ selectedTab } onSelect={ wire('tabs.select') } onClose={ wire('tabs.close') }>
            <TabBar.Tab label='Game 1' closingDisabled>
                <FileExplorer
                    rootName='/'
                    onDelete={ r.pipe(
                        (it) => elements[it].id,
                        wire(gameModel.elements.deleteElement)
                    ) }>

                    { elements.map((it, idx) =>
                        <FileExplorer.File
                            name={ it.name }
                            onDoubleClick={ r.pipe(r.always(it.id), wire('elements.open')) }>
                            <div className='design-view__file'>
                                <ElementRenderer element={ it } viewBox={ `0 0 ${ it.width } ${ it.height }`} showDocument />
                                <div className='design-view__count'>
                                    <HGroup modifiers='margin-s'>
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

                    <FileExplorer.File name='Create deck' onDoubleClick={ wire('elements.new') }>
                        <Icon name='create' />
                    </FileExplorer.File>
                </FileExplorer>
            </TabBar.Tab>

            { tabs.map((it, idx) =>
                <TabBar.Tab label={ tabTypes[it.component].label(it.props, elements) } key={ idx }>
                    { React.createElement(
                        tabTypes[it.component].component,
                        (tabTypes[it.component].props || r.identity)(it.props, wire, idx)
                    ) }
                </TabBar.Tab>
            ) }
        </TabBar>
)
