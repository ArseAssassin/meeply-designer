let url = require('url')

module.exports = switchboard.model(({ signal }) => {
    let path =
            signal(undefined, kefir.fromEvents(window, 'hashchange'))
            .map(() => window.location.hash.slice(1) || '/'),

        route =
            path.map((it) =>
                threadLast(routes)(
                    r.omit(['navigate']),
                    r.toPairs,
                    r.find(([_, route]) => route.match(it)),
                    (it) => it || [],
                    ([name, route]) =>
                        !name
                            ? { name: '404', route, params: {}, query: {} }
                            : { name, route, params: route.match(it), query: url.parse(it, true).query }
                )
            )

    return ({
        path: {
            signal: path
        },
        routeInformation: {
            signal: route
        },
        params: {
            signal: route.map(r.pathOr({}, words('params')))
        }
    })

})
