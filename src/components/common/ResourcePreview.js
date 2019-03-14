let FontStyleSheet = require('components/common/FontStyleSheet.js')

require('./resource-preview.styl')

module.exports = ({ resource, modifiers='' }) =>
    <div className={ modifiersToClass('resource-preview', modifiers) }>
        {resource.type === 'font'
            ? <span style={{ fontFamily: resource.id ? JSON.stringify(resource.id) : undefined }}>
                <FontStyleSheet />
                The quick brown fox jumps over the lazy dog
            </span>
            : <img src={ resource.body } alt='thumbnail' />}
    </div>
