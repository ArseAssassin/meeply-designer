let storybookModel = require('model/storybookModel.js')


let Story = ({ children, name }) =>
        <div className='storybook__story'>
            <h1>{ name }</h1>
            <div>{ children }</div>
        </div>

Story.Chapter =
    ({ children, name }) => <div className='storybook__chapter'>
        <h4 className='storybook__chapter-heading'>{ name }</h4>
        <div className='storybook__chapter-body'>
            { children }
        </div>
    </div>

Story.Chapter.fromModifiers = (name, component, modifiers=[]) => [
        <Story.Chapter name={ `${name} without modifiers` }>
            { component }
        </Story.Chapter>
    ].concat(modifiers.map((it) =>
        <Story.Chapter name={ `${name} with modifiers ${it}` }>
            { React.cloneElement(component, r.merge(component.props, { modifiers: it })) }
        </Story.Chapter>
    ))

Story.Chapter.fromTemplate = (template, cases) =>
        threadLast(cases)(
            r.toPairs,
            r.map(([name, params]) =>
                <Story.Chapter name={ name }>
                    { React.cloneElement(template, r.merge(template.props, params)) }
                </Story.Chapter>
            )
        )

Story.log = switchboard.slot.toFn(storybookModel.log.append)

module.exports = Story
