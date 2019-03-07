let ReactDOM = require('react-dom')

require('./modal.styl')

module.exports = switchboard.component(
    ({ propsProperty, isAlive }) => {
        kefir.combine(
            [kefir.fromEvents(document, 'keyup').filter(r.propEq('keyCode', 27))],
            [propsProperty.map(r.pick(words('onClose isOpen'))).skipDuplicates(r.equals)]
        )
        .map(r.last)
        .filter(r.prop('isOpen'))
        .takeUntilBy(isAlive.filter(r.not))
        .onValue(({ onClose }) => onClose())

        return {}
    },
    ({ children, heading, isOpen, onClose }) =>
        isOpen
            ? ReactDOM.createPortal(
                <div
                    className='modal'
                    onClick={ (e) => {
                        if (e.target === e.currentTarget) {
                            onClose()
                        }
                    }}>
                    <div className='modal__wrapper'>
                        <VGroup>
                            <div className='modal__heading'>
                                <HGroup modifiers='grow align-center justify-space-between'>
                                    <div>{ heading }</div>
                                    <a href='#modal' onClick={ r.pipe(cancel, onClose) }><Icon name='x' /></a>
                                </HGroup>
                            </div>
                            <div className='modal__body'>
                                { children }
                            </div>
                        </VGroup>
                    </div>
                </div>,
                document.body
            )
            : null
)
