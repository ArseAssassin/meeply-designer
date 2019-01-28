let gameModel = require('model/gameModel.js'),
    Input = require('components/common/Input.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    { DEFAULT_PPI } = require('constants/units.js')


const MIN_CARDS = 1

module.exports = switchboard.component(
    ({ signal, slot }) => {
        let selectedDeck =
                signal(
                    '',
                    slot('deck.select')
                ),
            cardsToDraw =
                signal(
                    {},

                    slot('cards.set'), r.merge
                )

        return ({
            decks: gameModel.elements.signal.map(r.filter((it) => !it.template)),
            selectedDeck,
            cardsToDraw,
            drawnCards: signal(
                {},

                kefir.combine(
                    [slot('draw')],
                    [cardsToDraw]
                )
                .flatMapLatest(([deck, cardsToDraw]) =>
                    gameModel.elements.populateTemplate(
                        gameModel.elements.signal
                        .map(r.pipe(
                            r.filter((it) => it.template === deck),
                            r.map((it) => r.repeat(it, it.count)),
                            r.unnest,
                            r.sortBy(() => Math.random()),
                            r.take(cardsToDraw[deck] || MIN_CARDS)
                        ))
                    )
                    .map((it) => ({ [deck]: it }))
                ),
                r.merge
            )
        })
    },
    ({ wiredState: { drawnCards, selectedDeck, decks, cardsToDraw }, wire }) =>
        <VGroup>
            <Type modifiers='heading'>Test game decks</Type>

            { decks.map(({ id, name }) =>
                <VGroup key={ id }>
                    <Type modifiers='s heading'>{ name }</Type>

                   <form onSubmit={ r.pipe(cancel, r.always(id), wire('draw')) }>
                        <HGroup modifiers='margin-xs align-center'>
                            <Icon name='hash' modifiers='s' />
                            <VGroup modifiers='margin-s'>
                                <Input.Number
                                    value={ cardsToDraw[id] || MIN_CARDS }
                                    onChange={ r.pipe(
                                        r.path(words('target value')),
                                        parseInt,
                                        (it) => ({ [id]: it }),
                                        wire('cards.set')
                                    ) } />
                            </VGroup>

                            <button>Draw</button>
                        </HGroup>
                    </form>

                    <HGroup modifiers='wrap'>
                        { (drawnCards[id] || []).map((it, idx) =>
                            <ElementRenderer
                                key={ idx + it.id }
                                element={ it }
                                style={{ width: it.width / DEFAULT_PPI + 'in', height: it.height / DEFAULT_PPI + 'in' }}
                                viewBox={ `0 0 ${ it.width } ${ it.height }`}
                                showDocument />
                        )}
                    </HGroup>
                </VGroup>
            ) }

        </VGroup>
)
