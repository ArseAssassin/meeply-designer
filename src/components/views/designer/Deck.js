let FileFace = require('components/common/FileFace.js'),
    FileExplorer = require('components/common/FileExplorer.js')

module.exports = ({ onFileChange, onDeckAdd, onDeckToggle, deckShown, element, deck }) =>
    <div className={ modifiersToClass('element-view__deck', deckShown && 'shown') }>
        <button className='element-view__tab' onClick={ onDeckToggle }>Deck</button>

        <div className='element-view__cards'>
            <FileExplorer
                mustSelect
                hideBreadcrumbs
                toolbarEnabled
                onChange={ onFileChange }
                modifiers='column'
                defaultValue={ element.id }>
                { deck.map((it) =>
                    <FileFace key={ it.id } { ...(FileFace.params(it)) } />
                ) }

                <FileExplorer.File
                    name='Create component'
                    onDoubleClick={ onDeckAdd }
                    value='create'>
                    <Icon name='create' />
                </FileExplorer.File>
            </FileExplorer>
        </div>
    </div>
