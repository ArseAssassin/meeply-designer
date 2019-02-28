let uuid = require('uuid/v4'),

    Modal = require('components/common/Modal.js'),
    FileExplorer = require('components/common/FileExplorer.js'),

    resourcesModel = require('model/resourcesModel.js'),
    gameModel = require('model/gameModel.js'),
    fileUtils = require('utils/fileUtils.js')

require('./file-browser.styl')


module.exports = switchboard.component(
    ({ signal, slot, isAlive, propsProperty }) => {
        let chosenImage =
                signal(
                    undefined,

                    propsProperty.map(r.prop('value')),

                    slot('image.choose')
                    .filter((it) => !r.contains(it, words('more fractal-symbols upload')) && !r.contains('game-icons', it))
                )
                .thru(resourcesModel.images.getById)
                .map((it) => it || {}),
            save = kefir.constant((imageId) =>
                propsProperty
                .take(1)
                .onValue(({ onChange }) => onChange(imageId))
                .to(slot('toggle'))
            ),
            focusFn = signal(
                switchboard.slot.toFn(slot('focus'))
            )
            .takeUntilBy(isAlive.filter(r.not).map(r.always(undefined)))

        kefir.combine([
            propsProperty.map(r.prop('onImageFocus')).filter(Boolean).take(1),
            focusFn
        ])
        .onValue(([fn, focusFn]) => fn(focusFn))

        propsProperty.map(r.prop('type'))
        .skipDuplicates()
        .flatMapLatest((type) =>
            kefir.combine(
               [slot('upload')
                .map(r.last)
                .flatMapLatest(() => fileUtils.load(type === 'image' ? 'image/*' : '.woff2,.ttf,.otf'))
                .map((it) => ({ ...it, type, id: uuid() }))
                .to(resourcesModel.userImages.upload)
                .map(r.prop('id'))],
                [save]
            )
        )
        .onValue(([id, save]) => save(id))

        return ({
            save,
            isOpen: signal(
                false,

                slot('toggle'), r.not,
                slot('focus'), r.T,

                propsProperty
                .map(r.pick(words('value id autoOpen')))
                .skipDuplicates(r.equals)
                .filter(({ value, autoOpen }) => autoOpen && !value),
                r.T
            ),
            resourceName:
                propsProperty.map(r.prop('value'))
                .thru(resourcesModel.images.getById)
                .map(r.propOr('', 'name')),
            userImages: resourcesModel.userImages.signal.map(r.pipe(r.values, r.sortBy(r.prop('name')))),
            usedImages:
                gameModel.elements.signal
                .flatMapLatest((elements) => threadLast(elements)(
                    r.map((it) => it.body.filter((it) => it.type === 'image')),
                    r.unnest,
                    r.map(r.prop('id')),
                    r.uniq,
                    r.map((id) => threadLast(elements)(
                        r.map((it) => it.body.filter((it) => it.id === id)),
                        r.unnest,
                        r.map(r.prop('body'))
                    )),
                    r.unnest,
                    r.uniq,
                    r.filter(Boolean),
                    (it) => kefir.combine(
                        it.map((it) => resourcesModel.images.getById(kefir.constant(it)))
                    )
                ))
                .toProperty(),
            libraryImages: resourcesModel.libraryImages.signal.map(r.pipe(r.values, r.sortBy(r.prop('name')))),
            chosenImage
        })
    },
    ({ wiredState: { save, chosenImage, resourceName, usedImages, userImages, libraryImages, isOpen }, wire, value, onChange, type }) => {
        return <VGroup modifiers='margin-s'>
            <div onClick={ wire('toggle') }>
                <VGroup modifiers='margin-s'>
                    <Type modifiers='s'>{ resourceName }</Type>
                    <button>Browse...</button>
                </VGroup>
            </div>

            <Modal
                onClose={ wire('toggle') }
                isOpen={ isOpen }
                heading='Resources'>

                <VGroup>
                    <HGroup modifiers='grow align-center'>
                        <div className='file-browser__files'>
                            <FileExplorer
                                defaultValue={ chosenImage.id }
                                onChange={ wire('image.choose') }
                                rootName={ <Icon name='home' modifiers='s' /> }
                                modifiers='icon-xs'
                                searchEnabled
                                preview={
                                    <div className='file-browser__preview' data-group-modifiers='align-center'>
                                        { chosenImage.id
                                            ? <VGroup>
                                                <img alt='preview' src={ chosenImage.body } />
                                                <Type modifiers='align-center'>{ chosenImage.name }</Type>
                                                <Type modifiers='align-center'>{ chosenImage.license }</Type>

                                                <HGroup modifiers='grow justify-center'>
                                                    <button onClick={ () => save(chosenImage.id) }>Save</button>
                                                </HGroup>
                                            </VGroup>
                                            : null
                                        }
                                    </div>
                                }>
                                <FileExplorer.Folder name='Game Icons' value='game-icons'>
                                    { threadLast(libraryImages)(
                                        r.filter((it) => it.source === 'game-icons.net'),
                                        r.groupBy((it) => it.name[0].toUpperCase()),
                                        r.toPairs,
                                        r.map(([folder, items]) =>
                                            <FileExplorer.Folder
                                                key={ folder }
                                                name={ folder }
                                                value={ 'game-icons' + folder }>
                                                { items.map((it) =>
                                                    <FileExplorer.File
                                                        value={ it.id }
                                                        name={ it.name }
                                                        key={ it.id }
                                                        onDoubleClick={ () => save(it.id) }>
                                                        <img src={ it.body } alt='thumbnail' />
                                                    </FileExplorer.File>
                                                )}
                                            </FileExplorer.Folder>
                                        ),
                                        r.unnest
                                    ) }
                                </FileExplorer.Folder>

                                <FileExplorer.Folder name='Fractal Symbols' value='fractal-symbols'>
                                    { libraryImages.filter((it) => it.source === 'Fractal Icons').map((it) =>
                                        <FileExplorer.File
                                            value={ it.id }
                                            name={ it.name }
                                            key={ it.id }
                                            onDoubleClick={ () => save(it.id) }>
                                            <img src={ it.body } alt='thumbnail' />
                                        </FileExplorer.File>
                                    ) }
                                </FileExplorer.Folder>

                                <FileExplorer.File
                                    value='upload'
                                    name={ type === 'image' ? 'Upload image' : 'Upload font'}
                                    onDoubleClick={ wire('upload') }>
                                    <Icon name='upload' />
                                </FileExplorer.File>

                                { (usedImages || []).map((it) =>
                                    <FileExplorer.File
                                        value={ it.id }
                                        key={ it.id }
                                        name={ it.name }
                                        onDoubleClick={ () => save(it.id) }>
                                        <img src={ it.body } alt='thumbnail' />
                                    </FileExplorer.File>
                                ) }
                            </FileExplorer>
                        </div>
                    </HGroup>
                </VGroup>
            </Modal>

        </VGroup>
    }
)

