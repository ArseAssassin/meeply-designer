let ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    gameModel = require('model/gameModel.js'),
    Input = require('components/common/Input.js')


let onDelete = (it) => r.pipe(
        r.always(it.id),
        switchboard.slot.toFn(gameModel.elements.deleteElement)
    ),
    onRename = (it) => (name) =>
        switchboard.slot.toFn(gameModel.elements.updateElement)([
            it.id,
            { name }
        ]),
    deleteText = (it) =>
        !it.template
            ? 'Deleting this component will delete the whole component set. Are you sure you want to continue?'
            : 'Are you sure you want to delete this component? This action can not be undone.',
    value = r.prop('id'),
    params = (it) => ({
        onDelete: onDelete(it),
        onRename: onRename(it),
        deleteText: deleteText(it),
        value: value(it),
        element: it,
        name: it.name
    }),
    countAdjuster = (element) =>
        <HGroup modifiers='margin-s align-center' data-group-modifiers='grow'>
            <Icon name='copy' modifiers='m' />
            <Input.Number
                modifiers='grow'
                onClick={ cancel }
                onDoubleClick={ cancel }
                step='1'
                min='0'
                type='number'
                onChange={ r.pipe(
                    r.path(words('target value')),
                    parseInt,
                    r.pair(element.id),
                    switchboard.slot.toFn(gameModel.elements.setCount)
                ) }
                value={ element.count } />
        </HGroup>

module.exports = ({ element, onDoubleClick=Boolean, adjuster=countAdjuster, ...rest }) =>
    <FileExplorer.File
        { ...rest }
        name={ element.name }
        onDoubleClick={ r.pipe(r.always(element.id), onDoubleClick) }>
        <div className='design-view__file'>
            <ElementRenderer
                element={ element }
                viewBox={ `0 0 ${ element.width } ${ element.height }`}
                showDocument />

            <div className='design-view__meta'>
                <HGroup modifiers='grow margin-s justify-space-between'>
                    { adjuster(element) }

                    { !element.template && <Icon name='key' modifiers='m' /> }
                </HGroup>
            </div>


        </div>
    </FileExplorer.File>

module.exports.params = params
