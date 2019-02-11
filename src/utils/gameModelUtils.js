let uuid = require('uuid/v4'),
    gameModel = require('model/gameModel.js')


let findName = (name, names, index=2) => {
        let proposedName = `${name} #${index}`

        return r.contains(proposedName, names)
            ? findName(name, names, index + 1)
            : proposedName
    }

module.exports = {
    addToDeck: (templateIds) =>
        kefir.combine(
            [templateIds],
            [gameModel.elements.signal]
        )
       .map(([templateId, elements]) => ({
            template: templateId,
            name: findName(
                    r.find(r.propEq('id', templateId), elements).name,
                elements.filter((it) => it.id === templateId || it.template === templateId).map(r.prop('name'))
            ),
            id: uuid(),
            count: 1,
            body: []
        }))
        .to(gameModel.elements.createElement)
}
