let { isValid } = require('valivali'),
    InputUpdater = require('components/forms/InputUpdater.js')

let adaptForm = (it) =>
        it.map(r.prop('name'))
        .skipDuplicates()
        .flatMapLatest((name) =>
            kefir.combine([
                it.flatMapLatest(r.prop('formValue')).map(r.prop(name)).skipDuplicates().toProperty(),
                it.flatMapLatest(r.prop('formErrors')).map(r.prop(name)).skipDuplicates(),

                kefir.combine([
                    it.map(r.prop('showErrors')),

                    kefir.combine([
                        it.flatMapLatest(r.prop('formErrors')).map(r.pipe(r.prop(name), isValid, r.not)),

                        kefir.defaultValue(
                            false,

                            it.map(r.prop('showErrorsOnErrorChange'))
                            .skipDuplicates()
                            .flatMapLatest((showErrorsOnErrorChange) =>
                                it.flatMapLatest(r.prop(showErrorsOnErrorChange ? 'formErrors' : 'formValue'))
                            )
                            .map(r.prop(name))
                            .skipDuplicates(r.equals)
                            .changes()
                            .flatMapLatest(() => kefir.defaultValue(false, kefir.later(700, true)))

                        )
                    ])
                    .map(r.apply(r.and))
                ])
                .map(r.apply(r.or))
            ])
            .skipDuplicates(r.equals)
        )
        .toProperty()
        .map(([value, error, hasChanged]) => ({ value, error, showErrors: !isValid(error) && hasChanged }))
        .skipDuplicates(r.equals),

    adaptOutput = ({ name, formUpdate }) =>
        formUpdate.map((fn) =>
            ({ onChange: (e) => fn({ [name]: e.target.value }) })
        ),
    FormField = withName('FormField', switchboard.component(
        ({ propsProperty, signal }) => ({
            inputProps:
                signal(
                    {},

                    propsProperty.map((it) => it.inputAdapter || adaptForm)
                    .skipDuplicates()
                    .flatMapLatest((it) => it(propsProperty))
                ),

            outputProps:
                propsProperty
                .skipDuplicates(r.equals)
                .flatMapLatest((props) =>
                    (props.outputAdapter || adaptOutput)(props)
                )
                .toProperty()
        }),
        ({ wiredState: { inputProps, outputProps }, children, passForward='', ...rest }) =>
            React.cloneElement(children, ({
                ...children.props,
                ...r.pick(words(passForward), rest),
                ...inputProps,
                ...outputProps
            }))
    ))

module.exports = ({ children, reducer, ...props }) =>
    <FormField {...props}>
        <InputUpdater name={ props.name } {...{ children, reducer }} />
    </FormField>


let selectInputAdapter = (it) =>
    it

    .map(r.prop('name'))
    .skipDuplicates()
    .flatMapLatest((name) => {
        let value =
                it.flatMapLatest(r.prop('formValue'))
                .map(r.prop(name))
                .skipDuplicates()
                .toProperty()

        return kefir.combine([
            value,

            it.flatMapLatest(r.prop('formErrors'))
            .map(r.prop(name))
            .skipDuplicates(),

            kefir.defaultValue(false, value.changes().map(r.T))
        ])
        .map(([value, error, showErrors]) => ({
            value,
            error,
            showErrors: !isValid(error) && showErrors
        }))
    })
    .toProperty()

module.exports.Select = (props) =>
    <FormField
        inputAdapter={ selectInputAdapter }
        {...props} />


module.exports.Submit = ({ disabled, ...props}) =>
    <FormField
        inputAdapter={ (it) => it.flatMapLatest(r.prop('formErrors')).map((it) => ({ disabled: !isValid(it) || disabled })) }
        {...props} />

let checkboxInputAdapter = (it) =>
        kefir.combine([
            it.flatMapLatest(r.prop('formValue')),
            it.map(r.prop('name'))
        ])
        .skipDuplicates(r.equals)
        .map(([formValue, name]) => ({ checked: formValue[name] })),

    checkboxOutputAdapter = ({ formUpdate, name }) =>
        formUpdate.map((fn) => ({
            onChange: (e) => fn({ [name]: e.target.checked })
        }))

module.exports.Checkbox = (props) =>
    <FormField
        inputAdapter={ checkboxInputAdapter }
        outputAdapter={ checkboxOutputAdapter }
        {...props} />


let basicInputAdapter = (it) =>
        kefir.combine([
            it.flatMapLatest(r.prop('formValue')),
            it.flatMapLatest(r.prop('formErrors')),
            it.map(r.prop('name'))
        ])
        .map(([formValue, formErrors, name]) => ({
            value: formValue[name],
            error: formErrors[name]
        }))
        .skipDuplicates(r.equals),
    basicOutputAdapter = ({ name, formUpdate }) => formUpdate.map((fn) =>
        ({ onChange: (value) => fn({ [name]: value }) })
    )


module.exports.Basic = (props) =>
    <FormField
        inputAdapter={ basicInputAdapter }
        outputAdapter={ basicOutputAdapter } {...props} />

let formTableInputAdapter = (it) =>
        kefir.combine([
            it.map(r.prop('formValue')).skipDuplicates(),
            it.map(r.prop('formErrors')).skipDuplicates(),
            it.map(r.prop('name')).skipDuplicates(),

            it.flatMapLatest(r.prop('formValue'))
        ])
        .map(([formValue, formErrors, name, currentValue]) => ({
            formValue: formValue.map(r.prop(name)).skipDuplicates(),
            formErrors: formErrors.map(r.prop(name)).skipDuplicates(),
            elementsLength: currentValue[name].length
        }))
        .skipDuplicates(r.equals),

    formTableOutputAdapter = ({ name, formValue, formUpdate }) =>
        formUpdate.skipDuplicates().map((fn) => {
            let formUpdateFn = (update) => (...values) =>
                formValue.take(1)
                .onValue((it) => {
                    fn({ [name]: update(it[name], ...values) })
                })

            return ({
                formUpdate: kefir.constant((value) =>
                    fn({
                        [name]: value
                    })
                ),
                addItem: formUpdateFn((currentValue, addedValue) =>
                    currentValue.concat(addedValue)
                ),
                moveItem: formUpdateFn((currentValue, from, to) =>
                    threadLast(currentValue)(
                        r.remove(from, 1),
                        r.insert(to, currentValue[from])
                    )
                ),
                deleteItem:
                    formUpdateFn(
                        (it, index) => r.remove(index, 1, it)
                    )
            })
        }),
    formTableElementInputAdapter = (it) =>
        kefir.combine([
            it.map(r.prop('formValue')).skipDuplicates(),
            it.map(r.prop('formErrors')).skipDuplicates(),
            it.map(r.prop('index')).skipDuplicates()
        ])
        .map(([formValue, formErrors, index]) => ({
            formValue: formValue.map(r.prop(index)).filter((it) => it !== undefined).skipDuplicates(),
            formErrors: formErrors.map(r.prop(index)).filter((it) => it !== undefined).skipDuplicates()
        })),
    formTableElementOutputAdapter = ({ index, formValue, formUpdate }) =>
        formUpdate.skipDuplicates().map((fn) => {
            let formUpdateFn = (update) => (value) =>
                    formValue.take(1).onValue((form) =>
                        fn(update(value, form))
                    )

            return ({
                formUpdate:
                    kefir.constant(formUpdateFn((value, form) =>
                        r.update(
                            index,
                            { ...form[index], ...value },
                            form
                        )
                    ))
            })
        })


module.exports.FormTable = (props) =>
    <FormField
        inputAdapter={ formTableInputAdapter }
        outputAdapter={ formTableOutputAdapter }
        { ...props } />

module.exports.FormTableElement = (props) =>
    <FormField
        inputAdapter={ formTableElementInputAdapter }
        outputAdapter={ formTableElementOutputAdapter }
        { ...props } />

