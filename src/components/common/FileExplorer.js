require('./file-explorer.styl')

let File = ({ name, children, ...rest }) =>
    <div className='file-explorer__file' { ...rest }>
        <VGroup modifiers='align-center grow'>
            <div className='file-explorer__file-face' data-group-modifiers='grow'>
                <VGroup modifiers='justify-center grow'>
                    { children }
                </VGroup>
            </div>
            <div className='file-explorer__file-name'>
                { name }
            </div>
        </VGroup>
    </div>

module.exports = switchboard.component(
    ({ signal, slot, propsProperty, isAlive }) => {
        let selected = kefir.combine([
                signal(-1,
                    slot('select'),

                    slot('unselect'), r.always(-1),

                    propsProperty.map(r.prop('defaultValue'))
                    .filter((it) => it !== undefined),

                    slot('navigate'), r.always(-1)
                ),
                propsProperty.map(r.prop('mustSelect'))
            ])
            .toProperty()
            .filter(([selection, mustSelect]) => !mustSelect || selection >= 0)
            .map(r.head)

        kefir.combine(
            [
                kefir.fromEvents(document.body, 'keydown')
                .filter((it) => it.keyCode === 46)
            ],
            [
                propsProperty.map(r.prop('onDelete')),
                selected
            ]
        )
        .filter(([_, onDelete, selected]) => onDelete && selected > -1)
        .takeUntilBy(isAlive.filter(r.not))
        .onValue(([_, onDelete, index]) => onDelete(index))

        return ({
            selected,

            path: signal(
                [],

                slot('navigate')
            )
        })
    },
    ({ wiredState: { path, selected }, wire, rootName, children, hideBreadcrumbs, onChange, modifiers }) => {
        let resolvePath = (path, it) =>
                path.length === 0
                    ? it
                    : resolvePath(r.tail(path), React.Children.toArray(it[r.head(path)].props.children)),
            contents = resolvePath(path, React.Children.toArray(children))

        return <VGroup modifiers='grow'>
            { !hideBreadcrumbs &&  <div className='file-explorer__breadcrumbs'>
                { threadLast(path)(
                    r.reduce((memo, next) => {
                        let lastComponent = r.last(memo),
                            pathComponent = lastComponent.children[next]

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

            <div className={ modifiersToClass('file-explorer', modifiers) }
                 data-group-modifiers='grow'
                 onClick={ (it) => it.target === it.currentTarget && wire('unselect')() }>
                { contents.map((it, idx) =>
                    <div key={ idx } className={ modifiersToClass('file-explorer__file-wrapper', selected === idx && 'selected') }
                         onClick={ r.pipe(r.always(idx), r.tap(onChange || Boolean), wire('select')) }>
                        { React.cloneElement(it, { navigateToThis: r.pipe(r.always(path.concat(idx)), wire('navigate')) }) }
                    </div>
                )}
            </div>
        </VGroup>
    }
)

module.exports.File = File

module.exports.Folder = ({ name, children, navigateToThis, ...rest }) =>
    <File name={ name } onDoubleClick={ () => navigateToThis() }>
        <Icon name='folder' />
    </File>
