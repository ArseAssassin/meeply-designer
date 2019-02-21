let gameModel = require('model/gameModel.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    { DEFAULT_PPI } = require('constants/units.js'),

    Button = require('components/common/Button.js')

require('./print-view.styl')

module.exports = switchboard.component(
    ({ signal, slot }) => {


        let contents = signal(
            '',

            slot('render.ref')
            .filter(Boolean)
            .map((it) => it.innerHTML + Array.from(document.querySelectorAll('style')).map((it) => it.outerHTML).join('\n'))
        ).skipDuplicates()

        kefir.combine(
            [contents, slot('print.ref').skipDuplicates()]
        )
        .onValue(([contents, ref]) => {
            ref.contentWindow.document.open()
            ref.contentWindow.document.write(contents)
            ref.contentWindow.document.close()
        })

        kefir.combine(
            [slot('print')],
            [slot('print.ref')]
        )
        .map(r.last)
        .onValue((iframe) => {
            iframe.contentWindow.focus()
            iframe.contentWindow.print()
        })

        return ({
            contents,
            elements: gameModel.elements.populateTemplate(gameModel.elements.signal)
        })
    },

    ({ wiredState: { elements }, wire }) =>
        <div className='print'>
            <div className='print__tools'>
                <Button modifiers='blue l' onClick={ wire('print') }>Print game</Button>
            </div>

            <div ref={ wire('render.ref') } style={{ display: 'none' }} id='print'>
                { threadLast(elements)(
                    r.groupBy((it) => it.width + '-' + it.height),
                    r.toPairs,
                    r.sortBy(r.head),
                    r.reverse,
                    r.map(([_, page]) =>
                        <div className='print__page'>
                            {page.map((it) =>
                                r.range(0, it.count).map((idx) =>
                                    <ElementRenderer
                                        key={ idx + it.id }
                                        element={ it }
                                        style={{ width: it.width / DEFAULT_PPI + 'in', height: it.height / DEFAULT_PPI + 'in' }}
                                        viewBox={ `0 0 ${ it.width } ${ it.height }`} />
                                )
                            )}
                        </div>
                    )
                ) }
            </div>

            <iframe title='Print' ref={ wire('print.ref') } className='print__iframe' src='#print'>

            </iframe>
        </div>
)
