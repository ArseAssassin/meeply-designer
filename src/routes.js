let Route = require('route-parser')

module.exports = r.mapObjIndexed(
    (it) => {
        let route = new Route(it),
            oldReverse = route.reverse

        route.reverse = (...params) => '#' + oldReverse.apply(route, params)

        return route
    },
    {
        app: '/',
        storybook: '/storybook(/:selectedStory)'
    }
)

module.exports.navigate = (it) => document.location.href = it
