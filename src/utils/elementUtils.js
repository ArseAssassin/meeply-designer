module.exports = {
    populateTemplate: (template, element) => ({
        width: element.body.width || template.width,
        height: element.body.height || template.height,
        ...element,
        body:
            template.body.map((it) => r.merge(
                it,
                threadLast(element.body)(
                    r.find(r.propEq('id', it.id)),
                    (it) => it
                        ? { ...it, isLinked: false }
                        : { isLinked: true }
                )
            ))
            .map((it) => ({ ...it, isCopy: true }))
    })
}
