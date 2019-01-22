let ramda = require('ramda')

global.React = require('react')
global.r = ramda
global.log = r.tap(console.log)

global.words = (it) => it.split(' ')

global.threadLast = (it) => (...rest) => r.pipe(...rest)(it)

global.modifiersToClass = (className, ...modifiers) =>
    threadLast(modifiers)(
        r.map((it) =>
            typeof it !== 'object'
                ? words(it || '')
                : threadLast(it)(
                    r.toPairs,
                    r.filter(r.last),
                    r.map(r.head)
                )
        ),
        r.flatten,
        r.filter(Boolean),
        r.map((it) => className + '--' + it),
        r.concat([className]),
        r.join(' ')
    )

let Group = ({ children, modifiers='', ref }) =>
    <div className={modifiersToClass('group', modifiers)} ref={ ref }>
        { React.Children.toArray(children).filter(Boolean).map((it, idx) =>
            <div
                className={modifiersToClass('group__child', (it.props || {})['data-group-modifiers'])}
                key={ idx }>
                { it }
            </div>
        ) }
    </div>

global.HGroup = ({ children, modifiers='' }) =>
    <Group children={ children } modifiers={ words(modifiers).concat('horizontal').join(' ') } />

global.VGroup = ({ children, modifiers='' }) =>
    <Group children={ children } modifiers={ words(modifiers).concat('vertical').join(' ') } />

global.kefir = require('kefir')
global.switchboard = require('reactive-switchboard')
global.routes = require('routes.js')
global.Icon = require('components/common/Icon.js')
global.cancel = r.tap((it) => {
    it.preventDefault()
    it.stopPropagation()
})
global.Type = require('components/common/Type.js')

global.withName = (name, fn) => {
    fn.displayName = name
    return fn
}

kefir.defaultValue = (value, stream) => kefir.constant(value).merge(stream).toProperty()
