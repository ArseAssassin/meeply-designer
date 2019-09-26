let Color = require('react-color'),

    Button = require('components/common/Button.js'),

    { rgbaToCss } = require('utils/colorUtils.js')


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
        <input type='range' className={ modifiersToClass('input-range',  modifiers) } />,

    Select: ({ modifiers='', label, ...rest }) =>
        <label><VGroup modifiers='margin-s'>
            <span>{ label }</span>
            <select {...rest} />
        </VGroup></label>,
    Color: switchboard.component(
        ({ signal, slot }) => ({
            isOpen: signal(
                false,

                slot('toggle'), r.not
            )
        }),

        ({ wiredState: { isOpen }, wire, modifiers='', label, value, onChange, defaultValue, ...rest }) =>
            <VGroup modifiers='margin-s'>
                <Button modifiers='s' onClick={ wire('toggle') }>
                    <HGroup modifiers='margin-s align-center'>
                        <div className='input__color-picker-preview' style={{
                                backgroundColor:
                                    value
                                      ? rgbaToCss(value)
                                      : defaultValue
                                 }} />
                        { label }
                        <Icon
                            modifiers='xs'
                            name={ !isOpen ? 'chevron-down' : 'chevron-up' } />
                    </HGroup>
                </Button>

                <div style={{ marginLeft: '1px', marginBottom: '1px', position: 'absolute', zIndex: 10 }}>
                    { isOpen &&
                        <Color.SketchPicker
                            onChange={ (it) => onChange(it.rgb) }
                            color={ value || defaultValue }
                            { ...rest } /> }
                </div>
            </VGroup>
    )
}
