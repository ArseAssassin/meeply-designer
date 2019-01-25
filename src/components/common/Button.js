require('./button.styl')

module.exports = ({ modifiers, ...props }) =>
    <button className={ modifiersToClass('button', modifiers ) } {...props} />
