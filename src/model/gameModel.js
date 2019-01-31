let { populateTemplate } = require('utils/elementUtils.js'),
    persistentSignal = require('model/persistentSignal.js')


let updateElement = (id, fn, it, cascadeChildren=false) =>
    it.map((it) =>
        it.id === id || (cascadeChildren && it.template === id)
            ? { ...it, ...fn(it) }
            : it
    )

module.exports = switchboard.model(({ signal, slot }) => {
    let elements =
        persistentSignal(signal)(
            'project',
            [],

            slot('elements.set'),

            slot('element.delete'), (it, id) =>
                it.filter((it) => it.id !== id || it.template !== id),

            slot('element.create'), (it, elem) => it.concat(elem),
            slot('element.updateCount'),
            (it, [id, count]) =>
                updateElement(id, r.always({ count }), it),

            slot('element.layers.add'),
            (it, [layer, id]) =>
                updateElement(id, (it) => ({
                    body: it.body.concat(layer)
                }), it),

            slot('element.layers.delete'),
            (it, [layer, id]) =>
                updateElement(id, (it) => ({
                    body: it.body.filter((it) => it.id !== layer)
                }), it, true),

            slot('element.update'),
            (it, [id, body]) =>
                updateElement(id, (it) => ({ ...it, ...body }), it),

            slot('element.layers.update'),
            (it, [layer, id, body]) =>
                updateElement(id, (it) => ({
                    body:
                        r.find(r.propEq('id', layer), it.body)
                            ? it.body.map((it) => it.id === layer
                                    ? { ...it, ...body }
                                    : it
                            )
                            : it.body.concat({ id: layer, ...body })
                }), it),
        ),
        findById = (it) =>
            kefir.combine([
                it,
                elements
            ])
            .toProperty()
            .map(([elementId, elements]) => r.find(r.propEq('id', elementId), elements))
            .filter(Boolean)
            .flatMapLatest((element) =>
                elements
                .map((elements) => r.find(r.propEq('id', element.template), elements))
                .skipDuplicates(r.equals)
                .map((template) =>
                    template
                        ? populateTemplate(template, element)
                        : element
                )
            )
            .toProperty()

    return ({
        elements: {
            signal: elements,
            findById,
            populateTemplate: (it) =>
                it.flatMapLatest((it) =>
                    it.length
                        ? kefir.combine(it.map((it) => findById(kefir.constant(it.id))))
                        : kefir.constant([])
                )
                .toProperty(),
            counts: elements.map((elements) =>
                threadLast(elements)(
                    r.filter((it) => !it.template),
                    r.map(({ id }) => [id, threadLast(elements)(
                        r.filter((it) => r.contains(id, [it.template, it.id])),
                        r.map((it) => it.count),
                        r.reduce((a, b) => a + b, 0)
                    )]),
                    r.fromPairs
                )
            ),
            createElement: slot('element.create'),
            updateElement: slot('element.update'),
            setCount: slot('element.updateCount'),
            deleteElement: slot('element.delete'),
            addLayer: slot('element.layers.add'),
            deleteLayer: slot('element.layers.delete'),
            updateLayer: slot('element.layers.update'),
            set: slot('elements.set')
        }
    })
})

