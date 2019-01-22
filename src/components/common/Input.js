require('./input.styl')

module.exports = {
    Text: ({ label, modifiers='', ...rest }) =>
        <VGroup modifiers='margin-s'>
            { label && <span className='input__label'>{ label }</span> }
            <input className={ modifiersToClass('input', modifiers) } { ...rest } />
        </VGroup>,
    Textarea: ({ label, modifiers='', ...rest }) =>
        <VGroup modifiers='margin-s'>
            { label && <span className='input__label'>{ label }</span> }
            <textarea className={ modifiersToClass('input', modifiers) } { ...rest } />
        </VGroup>,
    Number: ({ label, modifiers='', ...rest }) =>
        <VGroup modifiers='margin-s'>
            { label && <span className='input__label'>{ label }</span> }
            <input type='number' className={ modifiersToClass('input', modifiers) } { ...rest } />
        </VGroup>,
}
