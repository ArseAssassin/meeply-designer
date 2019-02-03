let ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    gameModel = require('model/gameModel.js')


let onDelete = (id) => r.pipe(
        r.always(id),
        switchboard.slot.toFn(gameModel.elements.deleteElement)
    ),
    onRename = (id) => (name) =>
        switchboard.slot.toFn(gameModel.elements.updateElement)([
            id,
            { name }
        ])

module.exports = ({ element, onDoubleClick=Boolean, setProps }) =>
    <FileExplorer.File
        name={ element.name }
        value={ element.id }
        onDelete={ onDelete(element.id) }
        onRename={ onRename(element.id) }
        setProps={ setProps }
        deleteText={
            !element.template
                ? 'Deleting this component will delete the whole deck. Are you sure you want to continue?'
                : 'Are you sure you want to delete this component? This action can not be undone.'
        }
        onDoubleClick={ r.pipe(r.always(element.id), onDoubleClick) }>
        <div className='design-view__file'>
            <ElementRenderer element={ element } viewBox={ `0 0 ${ element.width } ${ element.height }`} showDocument />
            <div className='design-view__count'>
                <HGroup modifiers='margin-s align-center'>
                    <Icon name='copy' modifiers='m' />
                    <input
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
            </div>

            { !element.template && <div className='design-view__file-type'>
                <Icon name='key' modifiers='m' />
            </div> }
        </div>
    </FileExplorer.File>
