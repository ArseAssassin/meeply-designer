require('globals.js')
require('app.styl')

let Router = require('components/Router.js'),
    Storybook = require('components/views/storybook/Storybook.js'),
    DesignView = require('components/views/designer/DesignView.js')


module.exports = () =>
    <Router notFound={ () => <h1>404</h1> }>
        { r.splitEvery(2, [
            routes.app, DesignView,
            routes.storybook, (rest) =>
                <Storybook
                    onSelectStory={ (it) => document.location.hash = routes.storybook.reverse({ selectedStory: it }) }
                    { ...(rest) }/>
        ]).map(r.apply(Router.makeRoute)) }
    </Router>
