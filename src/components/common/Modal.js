let ReactDOM = require('react-dom')

require('./modal.styl')

module.exports = ({ children, heading, isOpen, onClose }) =>
    isOpen
        ? ReactDOM.createPortal(
            <div className='modal' onClick={ (e) => {
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
