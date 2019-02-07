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
    Slider: ({ modifiers='', ...rest }) =>
        <input type='range' className={ modifiersToClass('input-range',  modifiers) } />
}
