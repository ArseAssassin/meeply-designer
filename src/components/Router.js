let routeModel = require('model/routeModel.js')

module.exports = switchboard.component(
    r.always({ routeInformation: routeModel.routeInformation.signal }),

    ({ wiredState: { routeInformation: { route, params, query } }, children, notFound }) => {
        return (r.find(r.propEq('route', route), children) || { handler: notFound }).handler(params, query)
    }
)

module.exports.makeRoute = (route, Component) => {
    return {
        route,
        handler: (params, query) =>
            <Component params={ params } query={ query } />
    }
}
