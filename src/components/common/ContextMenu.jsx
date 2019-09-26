let dom = require('react-dom')

require('./context-menu.styl')

module.exports = switchboard.component(
    ({ signal, slot }) => ({
        isOpen: signal(
            false,

            slot('toggle')
            .flatMapLatest(() =>
                signal(
                    true,

                    kefir.fromEvents(document.body, 'mouseup'), r.F
                )
                .takeWhile(Boolean)
                .beforeEnd(r.F)
            )
            .log()
        ),
        origin: signal(
            { left: 0, top: 0 },

            slot('toggle').map((it) => ({ left: it.clientX, top: it.clientY }))
        )
    }),
    ({ wiredState: { isOpen, origin }, wire, children: [anchor, ...items] }) =>
        [
            <span key='anchor'>{ React.cloneElement(anchor, { onClick: wire('toggle') }) }</span>,
            isOpen && dom.createPortal(
                <div
                    className='context-menu__menu'
                    style={ r.mapObjIndexed((it) => it + 'px', origin) }>
                    { items.map((it, idx) =>
                        <div className='context-menu__menu-item' key={ idx }>
                            { it }
                        </div>
                    ) }
            </div>, document.body)
        ]
)
