require('./storybook.styl')


let storybookModel = require('model/storybookModel.js')

let Stories = switchboard.component(
    ({ signal, slot }) => ({
        log: storybookModel.log.signal,
        logFolded: signal(true, slot('log.toggle'), r.not)
    }),
    ({ wiredState: { log, logFolded }, wire, children, selectedStory, onSelectStory }) =>
        <div className='storybook'>
            <nav>
                <h1 className='storybook__nav-heading'>Stories</h1>
                <ul>
                    { React.Children.toArray(children).map((it) => <li key={ it.props.name } className={ modifiersToClass('storybook__nav-link', selectedStory === it.props.name && 'selected') }>
                        <button onClick={ () => onSelectStory(it.props.name) }>{ it.props.name }</button>
                    </li>) }
                </ul>
            </nav>

            <article>
                { r.find((it) => it.props.name === selectedStory, React.Children.toArray(children)) ||
                <div>Select story from the left column</div> }
            </article>

            <div className={ modifiersToClass('storybook__console', logFolded && 'folded') }>
                <div className='storybook__console-toggle'>
                    <button
                        onClick={ wire('log.toggle')}
                        modifiers='blank grow small'>
                        <HGroup modifiers='grow justify-space-between align-center'>
                            <div>
                                Log ({ log.length })
                            </div>
                            <span>{ logFolded ? '↧' : '↥' }</span>
                        </HGroup>
                    </button>
                </div>

                <div>
                    { r.take(logFolded ? 1 : Number.MAX_SAFE_INTEGER, r.reverse(log)).map((it, idx) =>
                        <div className='storybook__log' key={ idx }>{ it }</div>
                    ) }
                </div>
            </div>
        </div>
)

/* eslint-disable global-require */
module.exports = ({ params: { selectedStory }, onSelectStory }) =>
    <Stories { ...{ selectedStory, onSelectStory } }>
        { require('./FileExplorer.Story.js') }
        { require('./TabBar.Story.js') }
    </Stories>
