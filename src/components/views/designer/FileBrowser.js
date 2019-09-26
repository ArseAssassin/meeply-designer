let uuid = require('uuid/v4'),

    Modal = require('components/common/Modal.js'),
    FileExplorer = require('components/common/FileExplorer.js'),
    ResourcePreview = require('components/common/ResourcePreview.js'),
    Button = require('components/common/Button.js'),

    resourcesModel = require('model/resourcesModel.js'),
    gameModel = require('model/gameModel.js'),
    fileUtils = require('utils/fileUtils.js')

require('./file-browser.styl')


let renderLibrary =
        (path, library, save) =>
            threadLast(library)(
                r.map(r.prop('path')),
                r.map((it) => {
                    let path = it.split('/')

                    return path.map((_, idx) =>
                        r.take(idx + 1, path).join('/')
                    )
                }),
                r.unnest,
                r.uniq,
                r.map((it) => r.take(path.split('/').length + (path === '' ? 0 : 1), it.split('/')).join('/')),
                r.uniq,
                r.filter((it) => it.length > path.length && r.contains(path, it)),
                r.map((folder) =>
                    <FileExplorer.Folder
                        key={ JSON.stringify(folder) }
                        name={ r.drop(path.split('/').length - (path === '' ? 1 : 0), folder.split('/')).join('/') }
                        value={ JSON.stringify(folder) }>
                        { renderLibrary(folder, library, save) }
                    </FileExplorer.Folder>
                ),
                r.concat(
                    threadLast(library)(
                        r.filter((it) => it.path === path),
                        r.map((it) =>
                            <FileExplorer.File
                                value={ it.id }
                                name={ it.name }
                                key={ it.id }
                                onDoubleClick={ () => save(it.id) }>
                                <ResourcePreview modifiers='s' resource={ it } />
                            </FileExplorer.File>
                        )
                    )
                )
            )

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
            .takeUntilBy(isAlive.filter(r.not).map(r.always(undefined))),
            type = propsProperty.map(r.prop('type')).skipDuplicates(),
            filterByType = (it) =>
                kefir.combine([it.map(r.filter(Boolean)), type])
                .toProperty()
                .map(([it, type]) => it.filter((it) => type === 'font' ? it.type === 'font' : it.type !== 'font'))

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
            userImages:
                resourcesModel.userImages.signal.map(r.pipe(r.values, r.sortBy(r.prop('name')))).thru(filterByType),
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
                .toProperty()
                .thru(filterByType),
            libraryImages: resourcesModel.libraryImages.signal.map(r.pipe(r.values, r.sortBy(r.prop('name')))).thru(filterByType),
            chosenImage
        })
    },
    ({ wiredState: { save, chosenImage, resourceName, usedImages, userImages, libraryImages, isOpen }, wire, value, onChange, type, advancedSearch }) => {
        return <VGroup modifiers='margin-s'>
            <div onClick={ wire('toggle') }>
                <VGroup modifiers='margin-s'>
                    <Type modifiers='s'>{ resourceName }</Type>
                    <Button modifiers='blue s'>Replace</Button>
                </VGroup>
            </div>

            <Modal
                onClose={ wire('toggle') }
                isOpen={ isOpen }
                heading='Resources'>

                <VGroup>
                    <HGroup modifiers='grow align-center'>
                        <div className='file-browser__files'>
                            { isOpen && <FileExplorer
                                defaultValue={ chosenImage.id }
                                onChange={ wire('image.choose') }
                                rootName={ <Icon name='home' modifiers='s' /> }
                                modifiers='icon-xs'
                                searchEnabled
                                advancedSearch={ advancedSearch }
                                preview={
                                    <div className='file-browser__preview' data-group-modifiers='align-center'>
                                        { chosenImage.id !== undefined
                                            ? <VGroup>
                                                <ResourcePreview resource={ chosenImage } />
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
                                { renderLibrary('', libraryImages, save) }

                                <FileExplorer.File
                                    value='upload'
                                    name={ type === 'image' ? 'Upload image' : 'Upload font'}
                                    onDoubleClick={ wire('upload') }>
                                    <Icon name='upload' />
                                </FileExplorer.File>

                                { r.uniqBy(r.prop('id'), (userImages || []).concat(usedImages || [])).map((it) =>
                                    <FileExplorer.File
                                        value={ it.id }
                                        key={ it.id }
                                        name={ it.name }
                                        onDoubleClick={ () => save(it.id) }>
                                        <ResourcePreview modifiers='s' resource={ it } />
                                    </FileExplorer.File>
                                ) }
                            </FileExplorer>}
                        </div>
                    </HGroup>
                </VGroup>
            </Modal>

        </VGroup>
    }
)

