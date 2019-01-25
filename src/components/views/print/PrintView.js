let gameModel = require('model/gameModel.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    { DEFAULT_PPI } = require('constants/units.js'),

    Button = require('components/common/Button.js')

require('./print-view.styl')

module.exports = switchboard.component(
    r.always({ elements: gameModel.elements.populateTemplate(gameModel.elements.signal) }),

    ({ wiredState: { elements } }) =>
        <div className='print'>
            <div className='print__tools'>
                <Button modifiers='blue l' onClick={ () => window.print() }>Print game</Button>
            </div>

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
)
