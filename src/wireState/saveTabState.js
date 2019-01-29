module.exports = (fn) => ({ signal, propsProperty, ...rest }) =>
    fn({
        signal,
        propsProperty,
        savedSignal: (name) => (...params) =>
            signal(
                ...params,

                propsProperty.map(r.prop('tabState'))
                .take(1)
                .filter((it) => r.has(name, it))
                .map(r.prop(name))
            )
            .onValue((it) =>
                propsProperty
                .take(1)
                .map(r.prop('onTabState'))
                .onValue((fn) =>
                    fn({ [name]: it })
                )
            ),
        ...rest
    })
