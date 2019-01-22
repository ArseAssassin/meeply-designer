let mapErrors = (formValue, formDefinition) =>
        formValue.map((it) =>
            r.mapObjIndexed(({ validator=r.always([]) }, name) => validator(it[name], it), formDefinition)
        )

module.exports = (formDefinition, updates=kefir.never(), errorsFn=mapErrors) => ({ signal, slot }) => {
    let formValue =
            signal(
                r.mapObjIndexed(r.prop('defaultValue'), formDefinition),

                slot('componentForm.update'), r.merge,
                updates, r.merge
            ),
        formErrors = errorsFn(formValue, formDefinition),

        formUpdate = kefir.constant(switchboard.slot.toFn(slot('componentForm.update'))),
        capture = kefir.constant((it) =>
            React.cloneElement(it, r.merge(it.props, {
                formValue,
                formErrors,
                formUpdate,
                capture
            }))
        )

    return { formValue, formErrors, capture, formUpdate }
}

module.exports.mapErrors = mapErrors
