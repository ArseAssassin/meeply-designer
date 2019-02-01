let Button = require('components/common/Button.js'),
    Modal = require('components/common/Modal.js'),
    Input = require('components/common/Input.js')

require('./file-explorer.styl')

let File = ({ name, label, children, isEditing, onBlur, onRename, ...rest }) =>
        <div className='file-explorer__file' { ...rest }>
            <VGroup modifiers='align-center grow justify-space-between'>
                <div className='file-explorer__file-face'>
                    <VGroup modifiers='justify-center grow'>
                        { children }
                    </VGroup>
                </div>
                <div className='file-explorer__file-name'>
                    { !isEditing
                        ? label || name
                        : <Input.Text
                            onBlur={ onBlur }
                            onChange={ r.pipe(r.path(words('target value')), onRename) }
                            onKeyDown={ (it) => {
                                if (it.keyCode === 13) {
                                    onBlur()
                                }
                            } }
                            value={ name }
                            _ref={ (it) => {
                                if (it && document.activeElement !== it) {
                                    it.focus()
                                    it.setSelectionRange(0, it.value.length)
                                }
                            } }
                            /> }
                </div>
            </VGroup>
        </div>,
    valueEq = r.curry((eq, value) => value.props.value === eq),
    resolvePath = (path, it) =>
        path.length === 0
            ? it
            :
            resolvePath(
                r.tail(path),
                React.Children.toArray(r.pathOr(it, words('props children'), r.find(valueEq(r.head(path)), it)))
            )

module.exports = switchboard.component(
    ({ signal, slot, propsProperty, isAlive }) => {
        let selected =
                kefir.combine([
                    signal(undefined,
                        slot('select'),

                        slot('unselect'), r.always(undefined),

                        propsProperty.map(r.prop('defaultValue')).skipDuplicates()
                        .filter((it) => it !== undefined)
                    ),
                    propsProperty.map(r.prop('mustSelect'))
                ])
                .toProperty()
                .filter(([selection, mustSelect]) => !mustSelect || selection !== undefined)
                .map(r.head),
            path =
                signal(
                    [],

                    slot('navigate')
                ),
            selectedComponent =
                kefir.combine([path, selected, propsProperty])
                .toProperty()
                .map(([path, value, { children }]) =>
                    r.find(
                        valueEq(value),
                        resolvePath(path, React.Children.toArray(children))
                    )
                )

        kefir.combine(
            [slot('delete.confirm')],
            [selectedComponent.map(r.path(words('props onDelete')))]
        )
        .filter(r.last)
        .onValue(([_, onDelete]) => onDelete())

        return ({
            selected,
            selectedComponent,
            isEditing: signal(
                false,

                slot('isEditing.toggle'), r.not
            ),
            isDeleting: signal(
                false,

                slot('delete.toggle'), r.not
            ),
            path
        })
    },
    ({ wiredState: { path, isDeleting, isEditing, selected, selectedComponent }, wire, rootName, children, hideBreadcrumbs, onChange, modifiers, preview, toolbarEnabled, canDelete }) => {
        let contents = resolvePath(path, React.Children.toArray(children))

        return <div className={ modifiersToClass('file-explorer', modifiers) }>
            <VGroup modifiers='grow margin-s'>
                { !hideBreadcrumbs &&  <div className='file-explorer__breadcrumbs'>
                    { threadLast(path)(
                        r.reduce((memo, next) => {
                            let lastComponent = r.last(memo),
                                pathComponent = r.find(valueEq(next), lastComponent.children)

                            if (!pathComponent) {
                                return memo
                            }

                            return memo.concat({
                                name: pathComponent.props.name,
                                path: lastComponent.path.concat(next),
                                children: React.Children.toArray(pathComponent.props.children)
                            })
                        }, [{ path: [], name: rootName, children: React.Children.toArray(children) }]),
                        r.intersperse({ name: '»' }),
                        r.map(({ path, name }) =>
                            path
                                ? <button
                                    key={ name }
                                    className='file-explorer__breadcrumb'
                                    onClick={ r.pipe(r.always(path), wire('navigate')) }>
                                    { name }
                                </button>
                                : <span className='file-explorer__arrow'>{ name }</span>
                        )
                    ) }
                </div> }

                { toolbarEnabled &&
                    <div className='file-explorer__toolbar'>
                        <HGroup modifiers='margin-xs'>
                            <Button
                                onClick={ wire('delete.toggle') }
                                disabled={ !selectedComponent || !selectedComponent.props.onDelete }>
                                <Icon name='trash' />
                            </Button>
                            <Button
                                onClick={ wire('isEditing.toggle') }
                                disabled={ !selectedComponent || !selectedComponent.props.onRename }>
                                <Icon name='rename' />
                            </Button>
                        </HGroup>
                    </div>
                }

                <div data-group-modifiers='grow'
                     onClick={ (it) => it.target === it.currentTarget && wire('unselect')() }>
                    <Modal isOpen={ isDeleting } heading='Confirm delete' onClose={ wire('delete.toggle') }>
                        <VGroup>
                            <div className='file-explorer__delete-confirm'>
                                <Type modifiers='align-center'>
                                    { selectedComponent && selectedComponent.props.deleteText }
                                </Type>
                            </div>

                            <HGroup modifiers='grow justify-end align-center margin-s'>
                                <button onClick={ wire('delete.toggle') }>Cancel</button>
                                <button onClick={ r.pipe(r.tap(wire('delete.toggle')), wire('delete.confirm')) }>Delete</button>
                            </HGroup>
                        </VGroup>
                    </Modal>

                    <HGroup modifiers='grow' data-group-modifiers='grow'>
                        <div className='file-explorer__items' data-group-modifiers='grow'>
                            { contents.map((it, idx) =>
                                <div key={ it.props.value } className={ modifiersToClass('file-explorer__file-wrapper', it.props.value === selected && 'selected') }
                                     onClick={ r.pipe(r.always(it.props.value), r.tap(onChange || Boolean), wire('select')) }>
                                    { React.cloneElement(it, {
                                        navigateToThis: r.pipe(
                                            r.always(path.concat(it.props.value)),
                                            wire('navigate')
                                        ),
                                        isEditing: selected === it.props.value && isEditing,
                                        onBlur: wire('isEditing.toggle'),
                                        onRename: selectedComponent && selectedComponent.props.onRename
                                    }) }
                                </div>
                            )}
                        </div>

                        { preview }
                    </HGroup>
                </div>
            </VGroup>
        </div>
    }
)

module.exports.File = File

module.exports.Folder = ({ name, label, face=<Icon name='folder' />, children, navigateToThis, ...rest }) =>
    <File name={ name } label={ label } onDoubleClick={ () => navigateToThis() } { ...rest }>
        { face }
    </File>
