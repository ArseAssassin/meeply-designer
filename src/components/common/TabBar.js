require('./tab-bar.styl')

module.exports =
    ({ selected, wire, children, onClose, onSelect }) =>
        <div className='tab-bar'>
            <div className='tab-bar__tabs'>
                { React.Children.toArray(children).map((it, idx) =>
                    <button className={ modifiersToClass('tab-bar__tab', selected === idx && 'selected') }
                         key={ idx }
                         onAuxClick={ (e) => !it.props.closingDisabled && onClose(idx) }
                         onClick={ (e) => onSelect(idx) }>
                        <HGroup modifiers='align-center margin-s'>
                            { it.props.label }

                            { !it.props.closingDisabled &&
                                <button
                                    className='tab-bar__close-button'
                                    onClick={ r.pipe(cancel, r.always(idx), onClose) }>
                                    <Icon name='x' />
                                </button> }
                        </HGroup>
                    </button>
                ) }
            </div>

            <div className='tab-bar__body'>
                { React.Children.toArray(children)[selected] }
            </div>
        </div>

module.exports.Tab = ({ children }) =>
    children
