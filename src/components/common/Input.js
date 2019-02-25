require('./input.styl')

module.exports = {
    Text: ({ label, modifiers='', _ref, ...rest }) =>
        <VGroup modifiers='margin-s'>
            { label && <span className='input__label'>{ label }</span> }
            <input ref={ _ref } className={ modifiersToClass('input', modifiers) } { ...rest } />
        </VGroup>,
    Textarea: ({ label, modifiers='', _ref, ...rest }) =>
        <VGroup modifiers='margin-s'>
            { label && <span className='input__label'>{ label }</span> }
            <textarea ref={ _ref } className={ modifiersToClass('input', modifiers) } { ...rest } />
        </VGroup>,
    Number: ({ label, modifiers='', ...rest }) =>
        <VGroup modifiers='margin-s'>
            { label && <span className='input__label'>{ label }</span> }
            <input type='number' className={ modifiersToClass('input', 'number', modifiers) } { ...rest } />
        </VGroup>,
    Checkbox: ({ label, modifiers='', ...rest }) =>
        <label><HGroup modifiers='margin-s'>
            <input type='checkbox' className={ modifiersToClass('input', 'checkbox', modifiers) } { ...rest } />
            { label && <span className='input__label'>{ label }</span> }
        </HGroup></label>,
    Slider: ({ modifiers='', ...rest }) =>
        <input type='range' className={ modifiersToClass('input-range',  modifiers) } />
}
