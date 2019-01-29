let gameModel = require('model/gameModel.js')

module.exports = switchboard.component(
    ({ signal, slot }) => {
        return ({
            decks:
                gameModel.elements.signal.map(
                    (elements) =>
                        elements.filter((it) => !it.template)
                        .map(({ name, id }) => [id, name, threadLast(elements)(
                            r.filter((it) => it.template === id),
                            r.map((it) => it.count),
                            r.reduce((a, b) => a + b, 0)
                        )])
                )
        })
    },
    ({ wiredState: { decks }, wire }) =>
        <VGroup>
            <Type modifiers='heading'>Game pieces</Type>

            { decks.map(([id, name, count]) =>
                <HGroup key={ id } modifiers='align-center'>
                    <Type>{ name }</Type>
                    <HGroup modifiers='margin-xs align-center'>
                        <Icon name='count' modifiers='s' />
                        { count }
                    </HGroup>
                </HGroup>
            ) }
        </VGroup>
)
