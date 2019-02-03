let gameModel = require('model/gameModel.js'),
    Input = require('components/common/Input.js'),
    ElementRenderer = require('components/views/designer/ElementRenderer.js'),
    { DEFAULT_PPI } = require('constants/units.js'),

    saveTabState = require('wireState/saveTabState.js')


const MIN_CARDS = 1

module.exports = switchboard.component(
    saveTabState(({ savedSignal, signal, slot }) => {
        let selectedDeck =
                savedSignal('selectedDeck')(
                    '',
                    slot('deck.select')
                ),
            cardsToDraw =
                savedSignal('cardsToDraw')(
                    {},

                    slot('cards.update'), r.merge
                ),
            filters =
                savedSignal('filters')(
                    {},

                    slot('filters.update'), r.merge
                )

        return ({
            decks: gameModel.elements.signal.map(r.filter((it) => !it.template)),
            selectedDeck,
            cardsToDraw,
            filters,
            drawnCards: savedSignal('drawnCards')(
                {},

                kefir.combine(
                    [slot('draw')],
                    [cardsToDraw, filters]
                )
                .flatMapLatest(([deck, cardsToDraw, filters]) =>
                    gameModel.elements.populateTemplate(
                        gameModel.elements.signal
                        .map(r.pipe(
                            r.filter((it) => it.template === deck || it.id === deck),

                            r.map((it) => r.repeat(it, it.count)),
                            r.unnest,
                            r.sortBy(() => Math.random()),
                        ))
                    )
                    .map(r.pipe(
                        filters[deck]
                            ? r.filter((it) => {
                                let filter = filters[deck],
                                    [query, result] = filter.split('='),
                                    [id, field] = words(query)

                                return (r.find(r.propEq('id', id.trim()), it.body) || {})[field.trim()] === result.trim()
                            })
                            : r.identity,
                        r.take(cardsToDraw[deck] || MIN_CARDS),
                        (it) => ({ [deck]: it })
                    )),
                ),
                r.merge
            )
        })
    }),
    ({ wiredState: { drawnCards, selectedDeck, filters, decks, cardsToDraw }, wire }) =>
        <VGroup>
            <Type modifiers='heading'>Test game decks</Type>

            { decks.map(({ id, name }) =>
                <VGroup key={ id }>
                    <Type modifiers='s heading'>{ name }</Type>

                   <form onSubmit={ r.pipe(cancel, r.always(id), wire('draw')) }>
                        <HGroup modifiers='margin-xs align-center'>
                            <VGroup modifiers='margin-xs'>
                                <HGroup modifiers='margin-xs align-center'>
                                    <Icon name='count' modifiers='s' />
                                    <Input.Number
                                        value={ cardsToDraw[id] || MIN_CARDS }
                                        onChange={ r.pipe(
                                            r.path(words('target value')),
                                            parseInt,
                                            (it) => ({ [id]: it }),
                                            wire('cards.update')
                                        ) } />
                                </HGroup>

                                { /* <Input.Text
                                    placeholder='Filter deck'
                                    onChange={ r.pipe(
                                        r.path(words('target value')),
                                        (it) => ({ [id]: it }),
                                        wire('filters.update')
                                    )}
                                    value={ filters[id] || '' }/> */ }
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
