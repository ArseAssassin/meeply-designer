require('./type.styl')

let Type = ({ modifiers, children }) =>
        <span className={ modifiersToClass('type', modifiers) }>
            { children }
        </span>

module.exports = Type

